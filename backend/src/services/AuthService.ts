import type { PromiseReturn, ServiceReturn, SignupUser } from "../types.js";

class AuthService {
    async SignUp(data: SignupUser): PromiseReturn<SignupUser> {
        return {
            status: 200,
            data,
        };
    }
}

export default new AuthService();
