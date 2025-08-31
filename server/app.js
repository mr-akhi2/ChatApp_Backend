import express from "express";
import { connection } from "./Connections/connection.js";
import dotenv from "dotenv";
import cors from "cors";

import { app, server } from "./Socket.js";
import path from "path";
import router from "./Router/Router.js";

dotenv.config();
const PORT = process.env.PORT;
const __dirname = path.resolve();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use("/", router);

// app.post("/signup", async (req, res) => {
//   const { name, email, password } = req.body;
//   if (!name || !email || !password) {
//     return res.status(401).json({
//       success: false,
//       message: "All field is required",
//     });
//   }
//   const user = await Users.findOne({ email });
//   if (user) {
//     return res.status(401).json({
//       success: false,
//       message: "user already exist",
//     });
//   }
//   const users = await Users({
//     FullName: name,
//     email: email,
//     password: password,
//   });
//   await users.save();
//   return res.status(201).json({
//     success: true,
//     message: "Account Created successfully",
//   });
// });

// app.post("/login", async (req, res) => {
//   const SECRET = "Ak";
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.status(401).json({
//       success: false,
//       message: "ALL field is required",
//     });
//   }
//   try {
//     const user = await Users.findOne({ email });
//     if (user) {
//       if (password == user.password) {
//         const token = jwt.sign({ email }, SECRET, { expiresIn: "1h" });
//         res.cookie("token", token, {
//           httpOnly: true,
//           secure: false,
//           sameSite: "strict",
//         });
//         const newuser = await Users.findByIdAndUpdate(
//           user._id,
//           { token: token, isOnline: true },
//           { new: true }
//         );
//         return res.status(201).json({
//           success: true,
//           message: "login successfully",
//           newuser,
//         });
//       }
//       return res.status(401).json({
//         success: false,
//         message: "invalid password",
//       });
//     }
//     return res.status(401).json({
//       success: false,
//       message: "user not found",
//     });
//   } catch (error) {
//     return res.status(401).json({
//       success: false,
//       message: "internal server error",
//     });
//   }
// });

// app.post("/logout", async (req, res) => {
//   try {
//     const { userId } = req.body;

//     if (!userId) {
//       return res.status(400).json({
//         success: false,
//         message: "User ID is required",
//       });
//     }

//     const user = await Users.findByIdAndUpdate(
//       userId,
//       { token: "", isOnline: false },
//       { new: true }
//     );

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Logout successfully",
//     });
//   } catch (error) {
//     console.error("Logout error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// });

// app.get("/Allusers/", async (req, res) => {
//   const users = await Users.find({}).select("-password");
//   if (users) {
//     return res.status(201).json({
//       success: true,
//       users,
//     });
//   }
//   res.status(401).json({
//     success: false,
//     message: "not users yet",
//     users: [],
//   });
// });

// app.post("/sendmessage", async (req, res) => {
//   try {
//     const senderId = req.body.senderId;
//     const recieverId = req.body.recieverId;
//     const message = req.body.msg.messages;
//     // console.log(senderId, recieverId, message);
//     let conversation = await Conversation.findOne({
//       participents: { $all: [senderId, recieverId] },
//     });
//     if (!conversation) {
//       conversation = await Conversation.create({
//         participents: [senderId, recieverId],
//       });
//       // console.log(conversation);
//     }
//     const newMessage = await Message.create({
//       senderId,
//       recieverId,
//       message,
//     });
//     // console.log(newMessage);

//     if (newMessage) {
//       // console.log(newMessage._id);
//       conversation.message.push(newMessage._id);
//     }
//     await Promise.all([conversation.save(), newMessage.save()]);

//     // here we are sending the real time data

//     const recieverSocketId = GetRecieverSocketId(recieverId);
//     if (recieverSocketId) {
//       io.to(recieverSocketId).emit("newMessage", newMessage);
//     }
//     return res.status(201).json({
//       success: true,
//       newMessage,
//     });
//   } catch (error) {
//     res.status(401).json({
//       success: false,
//       messages: "internal server error",
//     });
//   }
// });

// app.post("/getMessages", async (req, res) => {
//   // console.log(req.body);
//   const senderId = req.body.senderId;
//   const recieverId = req.body.recieverId;
//   // console.log(senderId, recieverId);

//   const conversation = await Conversation.findOne({
//     participents: { $all: [senderId, recieverId] },
//   }).populate("message");

//   // console.log(conversation);
//   if (!conversation) {
//     return res.status(201).json({
//       success: true,
//       message: [],
//     });
//   }

//   return res.status(200).json({
//     success: true,
//     messages: conversation?.message,
//   });
// });
// app.patch("/profile/:id", upload.single("profile"), async (req, res) => {
//   const userId = req.params.id;
//   const profilePicture = req.file;
//   let cloudResponse;
//   try {
//     if (profilePicture) {
//       const fileUri = getDataUri(profilePicture);
//       cloudResponse = await cloudinary.uploader.upload(fileUri);
//     }
//     if (cloudResponse.secure_url) {
//       const user = await Users.findByIdAndUpdate(
//         userId,
//         { Profile: cloudResponse.secure_url },
//         { new: true }
//       );
//       if (!user) {
//         return res.status(401).json({
//           success: false,
//           message: "user not found",
//         });
//       }
//       return res.status(201).json({
//         success: true,
//         user,
//         message: "profile update",
//       });
//     }
//   } catch (e) {
//     res.status(400).json({
//       success: false,
//       message: "failed to update",
//     });
//   }
// });

// sending email to the user
// app.post("/sendEmail", async (req, res) => {
//   sendresponse(req, res, req.body);
// });

// app.use(express.static(path.join(__dirname, "/Frontend/dist")));

// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "/Frontend/dist/index.html"));
// });
server.listen(PORT, () => {
  console.log("server is running on port:" + PORT);
  connection();
});
