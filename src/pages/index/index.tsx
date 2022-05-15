import { memo, useEffect, useState } from "react";
import Taro from "@tarojs/taro";
import { View, Input, Button } from "@tarojs/components";
import { genTestUserSig } from "@/utils/GenerateTestUserSig";
import CustomerServiceIcon from "@/components/CustomerServiceIcon";
import tim from "../../utils/tim";
import "./index.scss";

export default memo(() => {
  const [userID, setUserID] = useState("123456");

  const scrollHandler = () => {
    console.log("scrollHandler");
  };

  const createGroup = () => {
    const promise = tim.createGroup({
      type: tim.TYPES.GRP_MEETING,
      name: "mt1",
      memberList: [{ userID: "12" }],
    });
    promise
      .then((imResponse) => {
        // 创建成功
        // 创建的群的资料
        console.log("groupID", imResponse.data.group.groupID);
        const payloadData = {
          conversationID: `GROUP${imResponse.data.group.groupID}`,
        };
        Taro.navigateTo({
          url: `/pages/chat/index?conversationInfomation=${JSON.stringify(
            payloadData
          )}`,
        });
      })
      .catch((imError) => {
        console.warn("createGroup error:", imError); // 创建群组失败的相关信息
      });
  };

  const joinGroup = (groupID: string) => {
    const payloadData = {
      conversationID: `GROUP${groupID}`,
    };
    Taro.navigateTo({
      url: `/pages/chat/index?conversationInfomation=${JSON.stringify(
        payloadData
      )}`,
    });
    // logger.log(`| TUI-Group | join-group | bindConfirmJoin | groupID: ${this.data.groupID}`);
    // tim
    //   .joinGroup({ groupID, type: tim.TYPES.GRP_MEETING })
    //   .then((imResponse) => {
    //     if (imResponse.data.status === "WaitAdminApproval") {
    //       // 等待管理员同意
    //       Taro.showToast({ title: "等待系统处理" });
    //     } else {
    //       const payloadData = {
    //         conversationID: `GROUP${groupID}`,
    //       };
    //       Taro.navigateTo({
    //         url: `/pages/chat/index?conversationInfomation=${JSON.stringify(
    //           payloadData
    //         )}`,
    //       });
    //     }
    //   })
    //   .catch((imError) => {
    //     console.warn("joinGroup error:", imError); // 申请加群失败的相关信息
    //   });
  };

  const onSDKReady = () => {
    // todo 查询当前无会话群，加入会话群
    joinGroup("@TGS#3I7HV5HIE");
    // todo 创建临时群
    // createGroup();
  };

  const login = () => {
    // 开始登录
    // userSig 后面从后台获取
    tim
      .login({
        userID,
        userSig: genTestUserSig(userID).userSig,
      })
      .then(() => {
        console.log("登录成功");
      })
      .catch((imError) => {
        console.warn("login error:", imError); // 登录失败的相关信息
      });
  };

  // useEffect(() => {
  //   login();
  //   tim.on(tim.EVENT.SDK_READY, onSDKReady);
  //   return () => {
  //     tim.off(tim.EVENT.SDK_READY, onSDKReady);
  //   };
  // }, []);
  return (
    <View className="home">
      {/* <Input
        className="userInput"
        type="text"
        placeholder="请输入userID"
        focus
        value={userID}
        onInput={(e) => setUserID(e.detail.value)}
      /> */}

      <CustomerServiceIcon userID={userID} />

      {/* <Button
        type="primary"
        onClick={() => {
          login();
        }}
      >
        登录
      </Button> */}
    </View>
  );
});
