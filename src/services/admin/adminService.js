import bcrypt from "bcryptjs";

import Admin from "../../models/Admin.js";

export const adminLogin = async ({email,password})=>{
    if(!email || !password){
        throw new Error("All fields are required");
    }else if(!email.includes("@")){
        throw new Error("Given email is not valid");
    }
    console.log("Mongoose readyState:", Admin.db.readyState);

const admin = await Admin.findOne({ email});
if(!admin){
    throw new Error("Admin not found");
}

const isMatch = await bcrypt.compare(password,admin.password);

if(!isMatch){
    throw new Error("Invalid password");
}
return admin;

}
