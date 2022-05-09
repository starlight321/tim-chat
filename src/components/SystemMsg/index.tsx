import { memo, useMemo } from "react";
import Taro from "@tarojs/taro";
import { View } from "@tarojs/components";
import { calculateTimeAgo } from "@/utils";
import tim from "@/utils/tim";
import { parseGroupSystemNotice } from "@/utils/message-facade";
import "./index.scss";

type Props = {
  message: any;
  onChangeSystemMessageList: (e) => void;
};

export default memo<Props>(({ message, onChangeSystemMessageList }) => {
  const { renderDom, messageTime } = useMemo(() => {
    const val = message || {};
    return {
      messageTime: calculateTimeAgo(val.time * 1000),
      renderDom: parseGroupSystemNotice(message),
    };
  }, [message]);

  const handleClick = () => {
    Taro.showActionSheet({
      itemList: ["同意", "拒绝"],
      success: (res) => {
        // this.triggerEvent("changeSystemMessageList", {
        //   message: this.data.message,
        // });
        onChangeSystemMessageList({ message });
        const option = {
          handleAction: "Agree",
          handleMessage: "欢迎进群",
          message,
        };
        if (res.tapIndex === 1) {
          // this.triggerEvent("changeSystemMessageList", {
          //   message: this.data.message,
          // });
          onChangeSystemMessageList({ message });
          option.handleAction = "Reject";
          option.handleMessage = "拒绝申请";
        }
        tim
          .handleGroupApplication(option)
          .then(() => {
            Taro.showToast({
              title:
                option.handleAction === "Agree" ? "已同意申请" : "已拒绝申请",
            });
          })
          .catch((error) => {
            Taro.showToast({
              title: error.message || "处理失败",
              icon: "none",
            });
          });
      },
    });
  };

  return (
    <View className="im-system-msg container">
      {message.payload.operationType === 1 ? (
        <View className="card handle">
          <View>
            <View className="time">{messageTime}</View>
            {{ renderDom }}
          </View>
          <View className="choose">
            <View className="button" onClick={handleClick}>
              处理
            </View>
          </View>
        </View>
      ) : (
        <View className="card">
          <View className="time">{messageTime}</View>
          {renderDom}
        </View>
      )}
    </View>
  );
});
