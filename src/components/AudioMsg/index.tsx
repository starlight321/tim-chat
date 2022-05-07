import Taro from "@tarojs/taro";
import { memo, useEffect, useMemo, useState } from "react";
import { Block, View, Image } from "@tarojs/components";
import { parseAudio } from "@/utils/message-facade";
import { pictures } from "../util";
import "./index.scss";

type Props = {
  message: any;
  messageList: any;
  isMine: boolean;
};

type AudioMsgState = {
  audioSave: any[];
  isPlay: boolean;
  Audio: any[];
  audKey?: number; //当前选中的音频索引值
};

//创建audio控件
const myAudio = Taro.createInnerAudioContext();
export default memo<Props>(({ message, messageList, isMine = true }) => {
  const [data, setData] = useState<AudioMsgState>({
    audioSave: [],
    isPlay: false,
    Audio: [],
  });
  const renderDom = useMemo(() => {
    return parseAudio(message || {});
  }, [message]);

  useEffect(() => {
    return () => {
      myAudio.stop();
    };
  }, []);

  useEffect(() => {
    filterAudioMessage(messageList);
  }, [messageList]);

  // 过滤语音消息,从消息列表里面筛选出语音消息
  const filterAudioMessage = (msgList) => {
    const list: any[] = [];
    for (let index = 0; index < msgList.length; index++) {
      if (msgList[index].type === "TIMSoundElem") {
        list.push(msgList[index]);
        Object.assign(msgList[index], {
          isPlaying: false,
        });
        setData((pre) => ({
          ...pre,
          audioSave: list,
        }));
      }
    }
  };

  //音频播放
  const audioPlay = (e) => {
    const id = e.currentTarget.dataset.id,
      audioSave = data.audioSave;
    let target: any = {};

    //设置状态
    audioSave.forEach((item) => {
      item.isPlaying = false;
      if (item.ID == id) {
        item.isPlaying = true;
        const audKey = audioSave.findIndex((value) => value.ID == item.ID);
        target = { audKey, isPlay: false };
      }
    });

    setData((pre) => ({
      ...pre,
      ...target,
      audioSave: [...audioSave],
      isPlay: true,
    }));

    myAudio.autoplay = true;
    const audKey = target.audKey,
      playSrc = audioSave[audKey].payload.url;
    myAudio.src = playSrc;
    myAudio.play();

    //开始监听
    myAudio.onPlay(() => {
      console.log("开始播放");
    });

    //结束监听
    myAudio.onEnded(() => {
      console.log("自动播放完毕");
      audioSave[target.audKey].isPlaying = false;
      setData((pre) => ({
        ...pre,
        audioSave: [...audioSave],
        isPlay: false,
      }));
    });

    //错误回调
    myAudio.onError((err) => {
      console.log(err);
      audioSave[target.audKey].isPlaying = false;
      setData((pre) => ({
        ...pre,
        audioSave: [...audioSave],
      }));
      return;
    });
  };

  // 音频停止
  const audioStop = () => {
    const audioSave = data.audioSave;
    //设置状态
    audioSave.forEach((item) => {
      item.isPlaying = false;
    });
    setData((pre) => ({
      ...pre,
      audioSave: [...audioSave],
      isPlay: false,
    }));
    myAudio.stop();

    //停止监听
    myAudio.onStop(() => {
      console.log("停止播放");
    });
  };

  return (
    <Block>
      <View className={`audio-message ${isMine ? "my-audio" : ""}`}>
        {!data.isPlay ? (
          <View className="audio" onClick={audioPlay} data-id={message.ID}>
            {/* 默认状态 未播放 */}
            <Image
              className={`image ${isMine ? "my-image" : ""}`}
              src={pictures.sendingAudio}
            />
            {renderDom[0].second}s
          </View>
        ) : (
          <View
            className="audio"
            data-value={message}
            onClick={audioStop}
            data-id={message.ID}
          >
            {/* 当前正在播放状态 */}
            <Image
              className={`image ${isMine ? "my-image" : ""}`}
              src={pictures.sendingAudio}
            />
            {renderDom[0].second}s
          </View>
        )}
      </View>
    </Block>
  );
});
