export interface SocketMessage {
    type: string;
    roomId: string;
    users?: string[]; 
}
