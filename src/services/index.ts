export enum ImStatus {
    "OVER" = 0,
    "CONNECT" = 1,
    "WAIT" = 2,
}

export type Conversation = {
    status?: ImStatus;
    conversationID?: string;
    type?: "C2C" | "GROUP" | "@TIM#SYSTEM";
}
export const fetchImStatus = async (userId: string, status: ImStatus) => {
    return new Promise<Conversation & { unreadCount?: number; }>((resolve) => {
        // 1、有进行中的会话, 返回 CONNECT状态1，和会话ID及类型
        if (status === ImStatus.CONNECT) {
            resolve({
                status: ImStatus.CONNECT,
                conversationID: "@TGS#3I7HV5HIE",
                type: "GROUP",
                unreadCount: 1,
            })
            return;
        }
        resolve({ status, type: "GROUP", })
    })
}

// 查询分类列表
export type ImCategory = {
    name: string;
    id: number;
    children?: ImCategory[];
}
export const fetchImCategory = async () => {
    return new Promise<ImCategory[]>((resolve) => {
        const list: ImCategory[] = [{
            name: "产品咨询",
            id: 1,
        }, {
            name: "售后服务",
            id: 2,
            children: [{
                name: "到店试驾",
                id: 3,
            },
            {
                name: "上门试驾",
                id: 4,
            }
            ]
        }]
        resolve(list)
    })
}

export const fetchQueuingProcess = async () => {
    return new Promise((resolve) => {
        const num = Math.random();
        if (num > 0.5) {
            resolve({
                status: ImStatus.CONNECT,
                conversationID: "@TGS#3I7HV5HIE",
                type: "GROUP",
            })
        }
        resolve({
            status: ImStatus.WAIT,
            sortNum: 2,
        })
    })
}

