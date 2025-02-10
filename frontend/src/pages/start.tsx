import { useState } from "react";
import "./../styles/start.css";
import { API_BASE } from "../Components/constants";
import { HostLobby } from "../Components/hostLobby";
import { v4 } from "uuid";
import { ratatosk } from "../Components/utils/Fetch";
import { setSessionStore } from "../Components/utils";

export function Start() {
    const [loading, setLoading] = useState(false);
    const [userCreated, setUserCreated] = useState(false);

    const signUpAsHost = async () => {
        try {
            setLoading(true);
            const request = await ratatosk.post<any>(`${API_BASE}/auth/signup`, {
                nickname: v4(),
                host: true,
            });
            if (request.status == 200) setUserCreated(true);
            const token = request.data.extra.token;
            console.log({ token });
            setSessionStore("token", token);

            console.log("Response ->", request);
            setLoading(false);
        } catch (e: any) {
            console.log("There was an error signing user up -> ", e);
            alert("An unexpected error occured");
            setLoading(false);
        }
    };

    return (
        <div className="main">
            {loading ? (
                <h1 className="header">Loading...</h1>
            ) : userCreated ? (
                <HostLobby setUserCreated={setUserCreated} />
            ) : (
                <>
                    <h1 className="p-4 text-5xl md:p-10 md:text-7xl header">Create a speed dating session </h1>
                    <button className="m-2" onClick={signUpAsHost}>
                        Let's start!
                    </button>
                </>
            )}
        </div>
    );
}
