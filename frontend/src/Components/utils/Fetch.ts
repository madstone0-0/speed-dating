import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { API_BASE } from "../constants";
import { IFetch } from "../../types";

class Fetch implements IFetch {
    private instance: AxiosInstance;

    /* eslint-disable @typescript-eslint/unbound-method */
    handleSuccess(res: AxiosResponse) {
        return res;
    }

    /* eslint-disable @typescript-eslint/restrict-template-expressions*/
    handleError(error: AxiosError) {
        console.log("AxiosError: ", { error });
        return Promise.reject(error);
    }
    /* eslint-enable @typescript-eslint/restrict-template-expressions*/
    /* eslint-enable @typescript-eslint/unbound-method */

    constructor() {
        const instance = axios.create({
            baseURL: API_BASE,
            headers: {
                Accept: "application/json",
            },
            withCredentials: true,
        });

        /* eslint-disable @typescript-eslint/unbound-method */
        instance.interceptors.response.use(this.handleSuccess, this.handleError);
        /* eslint-enable @typescript-eslint/unbound-method */

        this.instance = instance;
    }

    // redirectTo(path: string) {
    //
    // }

    async get<T = never, R = AxiosResponse<T>>(url: string, options?: AxiosRequestConfig<T>) {
        const res = await this.instance.get<T, R>(url, { ...options });
        return res;
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    async post<T = never, R = AxiosResponse<T>>(url: string, data: any, options?: AxiosRequestConfig<T>) {
        const res = await this.instance.post<T, R>(url, data, { ...options });
        return res;
    }

    async put<T = never, R = AxiosResponse<T>>(url: string, data: any, options?: AxiosRequestConfig) {
        const res = await this.instance.put<T, R>(url, data, { ...options });
        return res;
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */

    async delete<T = never, R = AxiosResponse<T>>(url: string, options?: AxiosRequestConfig<T>) {
        const res = await this.instance.delete<T, R>(url, { ...options });
        return res;
    }
}

export const ratatosk = new Fetch();
export default Fetch;
