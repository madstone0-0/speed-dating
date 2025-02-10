import { customLogger } from "../logger.js";
import { UserModel } from "../models/user.schema.js";
import type { PromiseReturn, ServiceReturn, SignupUser, User } from "../types.js";
import { prettyPrint } from "../utils.js";
import { UserService } from "./UserService.js";

class AuthService {
    async SignUp(data: SignupUser): PromiseReturn<User> {
        // let existingUser = await UserService.getUserByNick(data.nickname);
        // if (existingUser) {
        //     const updateRes = await UserModel.updateOne(
        //         { _id: existingUser._id },
        //         { host: data.host, nickname: existingUser.nickname, gender: data.gender },
        //     ); 
        //     customLogger(`Updated user ${existingUser._id} info: ${prettyPrint(updateRes)}`);
        //     existingUser = await UserService.getUserById(existingUser._id.toString());
        //     return {
        //         status: 200,
        //         data: existingUser!,
        //     };
        // }

        //Given the number of "nana" s in this school
        //I don't think we should do this. Would cause some issues.
        const user = await UserModel.create(data);
        return {
            status: 200,
            data: user,
        };
    }
}

export default new AuthService();
