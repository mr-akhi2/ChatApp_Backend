import express from "express";
import Users from "../models/user.js";
import multer from "multer";
import cloudinary from "../Connections/Cloudinary.js";
import nodemailer from "nodemailer";
import Conversation from "../models/conversation.js";
import Message from "../models/message.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import { app, server, io, GetRecieverSocketId } from "../Socket.js";
import DatauriParser from "datauri/parser.js";
const parser = new DatauriParser();

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });
const getDataUri = (file) => {
  const extName = path.extname(file.originalname).toString();
  return parser.format(extName, file.buffer).content;
};

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(401).json({
      success: false,
      message: "All field is required",
    });
  }
  const user = await Users.findOne({ email });
  if (user) {
    return res.status(401).json({
      success: false,
      message: "user already exist",
    });
  }
  const users = await Users({
    FullName: name,
    email: email,
    password: password,
  });
  await users.save();
  return res.status(201).json({
    success: true,
    message: "Account Created successfully",
  });
});
router.post("/login", async (req, res) => {

  // this is  for the system
  function getDeviceType() {
  try {
    // Check for Android (Termux usually sets process.platform to 'linux')
    if (os.platform() === "linux") {
      try {
        // Try to fetch Android manufacturer/model
        const manufacturer = execSync("getprop ro.product.manufacturer").toString().trim();
        const model = execSync("getprop ro.product.model").toString().trim();

        // If command worked and manufacturer is not empty, assume it's a phone
        if (manufacturer && model) {
          return `${manufacturer} ${model}`;
        }
      } catch (err) {
        // getprop not found → not Android
      }
    }

    // For non-Android (Windows, Linux PC, Mac) → treat as Laptop/Desktop
    return "Laptop/Desktop";
  } catch (err) {
    return "Unknown Device";
  }
}
  const SECRET = "Ak";
  const system= getDeviceType();

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(401).json({
      success: false,
      message: "ALL field is required",
    });
  }
  try {
    const user = await Users.findOne({ email });
    if (user) {
      if (password == user.password) {
        const token = jwt.sign({ email }, SECRET, { expiresIn: "1h" });
        res.cookie("token", token, {
          httpOnly: true,
          secure: false,
          sameSite: "strict",
        });
        const newuser = await Users.findByIdAndUpdate(
          user._id,
          { token: token, isOnline: true,
           system:system
          },
          { new: true }
        );
        return res.status(201).json({
          success: true,
          message: "login successfully",
          newuser,
        });
      }
      return res.status(401).json({
        success: false,
        message: "invalid password",
      });
    }
    return res.status(401).json({
      success: false,
      message: "user not found",
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "internal server error",
    });
  }
});
router.post("/logout", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await Users.findByIdAndUpdate(
      userId,
      { token: "", isOnline: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Logout successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});
router.get("/Allusers", async (req, res) => {
  const users = await Users.find({}).select("-password");
  if (users) {
    return res.status(201).json({
      success: true,
      users,
    });
  }
  res.status(401).json({
    success: false,
    message: "not users yet",
    users: [],
  });
});
router.post("/sendmessage", async (req, res) => {
  try {
    const senderId = req.body.senderId;
    const recieverId = req.body.recieverId;
    const message = req.body.msg.messages;
    // console.log(senderId, recieverId, message);
    let conversation = await Conversation.findOne({
      participents: { $all: [senderId, recieverId] },
    });
    if (!conversation) {
      conversation = await Conversation.create({
        participents: [senderId, recieverId],
      });
      // console.log(conversation);
    }
    const newMessage = await Message.create({
      senderId,
      recieverId,
      message,
    });
    // console.log(newMessage);

    if (newMessage) {
      // console.log(newMessage._id);
      conversation.message.push(newMessage._id);
    }
    await Promise.all([conversation.save(), newMessage.save()]);

    // here we are sending the real time data

    const recieverSocketId = GetRecieverSocketId(recieverId);
    if (recieverSocketId) {
      io.to(recieverSocketId).emit("newMessage", newMessage);
    }
    return res.status(201).json({
      success: true,
      newMessage,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      messages: "internal server error",
    });
  }
});

router.post("/getMessages", async (req, res) => {
  // console.log(req.body);
  const senderId = req.body.senderId;
  const recieverId = req.body.recieverId;
  // console.log(senderId, recieverId);

  const conversation = await Conversation.findOne({
    participents: { $all: [senderId, recieverId] },
  }).populate("message");

  // console.log(conversation);
  if (!conversation) {
    return res.status(201).json({
      success: true,
      message: [],
    });
  }

  return res.status(200).json({
    success: true,
    messages: conversation?.message,
  });
});

router.patch("/profile/:id", upload.single("profile"), async (req, res) => {
  const userId = req.params.id;
  const profilePicture = req.file;
  let cloudResponse;
  try {
    if (profilePicture) {
      const fileUri = getDataUri(profilePicture);
      cloudResponse = await cloudinary.uploader.upload(fileUri);
    }
    if (cloudResponse.secure_url) {
      const user = await Users.findByIdAndUpdate(
        userId,
        { Profile: cloudResponse.secure_url },
        { new: true }
      );
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "user not found",
        });
      }
      return res.status(201).json({
        success: true,
        user,
        message: "profile update",
      });
    }
  } catch (e) {
    res.status(400).json({
      success: false,
      message: "failed to update",
    });
  }
});
router.post("/user", async (req, res) => {
  const { token } = req.body;
  // console.log(token);
  if (token) {
    const user = await Users.findOne({ token });
    if (user) {
      return res.status(201).json({
        success: true,
        user,
      });
      // console.log(user);
    }
    return res.status(401).json({
      success: false,
      message: "user not find",
    });
  }
});

router.post("/sendEmail", async (req, res) => {
  try {
    const email = req.body.email;
    if (!email) {
      return res.status(401).json({
        message: "Email is required",
        success: false,
      });
    }

    const user = await Users.findOne({ email }).select("-Profile");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      secure: true,
      port: 465,
      auth: {
        user: "tpamanagement2024@gmail.com",
        pass: "llce icse zgzd ppxh", // <-- make sure to store this in ENV
      },
    });

    const mailOptions = {
      from: "tpamanagement2024@gmail.com",
      to: email,
      subject: "Your Chat App Login Information",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9fafb; color: #333;">
          <h1 style="color: #2563eb;">Hello ${user?.FullName},</h1>
          <p style="font-size: 16px;">Here is your login information:</p>

          <div style="padding: 12px; border: 1px solid #ddd; background: #fff; border-radius: 8px; margin-top: 10px;">
            <p style="margin: 0; font-size: 14px;"><strong>Email:</strong> ${user?.email}</p>
            <p style="margin: 0; font-size: 14px;"><strong>Password:</strong> ${user?.password}</p>
          </div>

          <p style="margin-top: 20px; font-size: 12px; color: #666;">
            If this wasn’t you, please reset your password immediately.
          </p>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);

    return res.status(200).json({
      message: "Mail sent to your email",
      messageID: result.messageId,
      status: true,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: "Email could not be sent",
      status: false,
      error,
    });
  }
});

export default router;
