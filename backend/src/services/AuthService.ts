import { UserModel } from "../models/user.schema.js";
import type { PromiseReturn, ServiceReturn, SignupUser, User } from "../types.js";

class AuthService {
    async SignUp(data: SignupUser): PromiseReturn<User> {
        const user = await UserModel.create(data);
        return {
            status: 200,
            data: user,
        };
    }
}

export default new AuthService();
