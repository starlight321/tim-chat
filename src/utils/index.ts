import Taro from "@tarojs/taro";

export function calculateTimeAgo(dateTimeStamp) {
    const minute = 1000 * 60;      // 把分，时，天，周，半个月，一个月用毫秒表示
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;
    const now = new Date().getTime();   // 获取当前时间毫秒
    const diffValue = now - dateTimeStamp;// 时间差
    let result = "";

    if (diffValue < 0) {
        return;
    }
    const minC = diffValue / minute;  // 计算时间差的分，时，天，周，月
    const hourC = diffValue / hour;
    const dayC = diffValue / day;
    const weekC = diffValue / week;
    if (weekC >= 1 && weekC <= 4) {
        result = ` ${parseInt(String(weekC), 10)}周前`;
    } else if (dayC >= 1 && dayC <= 6) {
        result = ` ${parseInt(String(dayC), 10)}天前`;
    } else if (hourC >= 1 && hourC <= 23) {
        result = ` ${parseInt(String(hourC), 10)}小时前`;
    } else if (minC >= 1 && minC <= 59) {
        result = ` ${parseInt(String(minC), 10)}分钟前`;
    } else if (diffValue >= 0 && diffValue <= minute) {
        result = "刚刚";
    } else {
        const dateTime = new Date();
        dateTime.setTime(dateTimeStamp);
        const nYear = dateTime.getFullYear();
        const nMonth = dateTime.getMonth() + 1 < 10 ? `0${dateTime.getMonth() + 1}` : dateTime.getMonth() + 1;
        const nDate = dateTime.getDate() < 10 ? `0${dateTime.getDate()}` : dateTime.getDate();
        result = `${nYear}-${nMonth}-${nDate}`;
    }
    return result;
}

// 获取平台信息
const getSystemInfoPlatform = () => {
    try {
        const res = Taro.getSystemInfoSync() // 读取设备所有信息
        return res.platform;
    } catch (error) {
        console.log(error)
    }
};

export const isAndroid = () => {
    return getSystemInfoPlatform() === "android"
}