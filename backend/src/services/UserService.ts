import { UserModel } from "../models/user.schema.js"

const getUserById = async(userId: string)=>{
    const user = await UserModel.findOne({ _id: userId});
    if(!user) return null;
    return user;
}

export const UserService = {
    getUserById
}