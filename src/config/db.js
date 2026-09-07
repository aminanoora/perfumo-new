import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");
 

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB DISCONNECTED");
    });

    mongoose.connection.on("error", (error) => {
      console.error("MongoDB ERROR:", error);
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB RECONNECTED");
    });
  } catch (error) {
    console.error("DB Connection Error:", error);
    throw error;
  }
};


export default connectDB;
