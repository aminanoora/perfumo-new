import User from "../../models/User.js";

const createUser = async (userData) => {
  const user = await User.create(userData);
  return user;
};

const getAllUsers = async () => {
  return await User.find().sort({ createdAt: -1 });
};

const getUserById = async (id) => {
  return await User.findById(id);
};

const blockUser = async (id) => {
  return await User.findByIdAndUpdate(
    id,
    { status: "blocked" },
    { new: true }
  );
};

const unblockUser = async (id) => {
  return await User.findByIdAndUpdate(
    id,
    { status: "active" },
    { new: true }
  );
};

export {
  createUser,
  getAllUsers,
  getUserById,
  blockUser,
  unblockUser,
};