import { memo, useMemo } from "react";
import { View } from "@tarojs/components";
import eventEmitter from "@/utils/eventEmitter";
import { ImCategory, ImStatus } from "@/services";
import "./index.scss";

type Props = {
  message: any;
};

export default memo<Props>(({ message }) => {
  const list = useMemo(() => {
    return message.payload?.list || [];
  }, [message]);

  console.log(">>>>>>>>>>>>>>>>", list);

  const handleClick = (category: ImCategory) => {
    if (!category.children || !category.children.length) {
      // const msg = tim.createTextMessage({
      //   to: toAccount,
      //   conversationType: "GROUP",
      //   payload: {
      //     text: category.name,
      //   },
      // });
      // updateMsgListHandle(msg);
      eventEmitter.emit("im_update_msg_list", [
        {
          payload: { text: category.name },
        },
      ]);
      // tim.sendMessage(msg, {
      //   offlinePushInfo: {
      //     disablePush: true,
      //   },
      // });
      // 开始排队
      eventEmitter.emit("im_update_conversation", { status: ImStatus.WAIT });
    } else {
      eventEmitter.emit("im_update_msg_list", [
        {
          payload: { text: category.name },
        },
        {
          type: "imCategory",
          payload: { list: category.children },
        },
      ]);
    }
  };

  return (
    <View className="im-nav-message">
      {list.map((category: ImCategory) => (
        <View
          className="category"
          key={category.id}
          onClick={() => handleClick(category)}
        >
          {category.name}
        </View>
      ))}
    </View>
  );
});
