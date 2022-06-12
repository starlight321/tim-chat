import Taro, { InnerAudioContext } from "@tarojs/taro";
import { memo, useEffect, useMemo } from "react";
import { Block, View, Image } from "@tarojs/components";
import eventEmitter from "@/utils/eventEmitter";
import { parseAudio } from "@/utils/message-facade";
import { pictures } from "../util";
import "./index.scss";

type Props = {
  message: any;
  isMine: boolean;
  currentIndex: number;
  audioRef: React.MutableRefObject<Taro.InnerAudioContext | undefined>;
};

//创建audio控件
const AudioMsg: React.FC<Props> = ({
  message,
  currentIndex,
  isMine,
  audioRef,
}) => {
  const renderDom = useMemo(() => {
    return parseAudio(message || {});
  }, [message]);

  useEffect(() => {
    return () => {
      audioRef.current && audioRef.current.destroy();
    };
  }, []);

  const audioEnded = () => {
    eventEmitter.emit("im_update_audio_msg", {
      isPlaying: false,
      index: currentIndex,
    });
  };

  // 监听停止
  const stopHandle = () => {
    console.log("停止播放");
  };

  const errorHandle = (err?: InnerAudioContext.onErrorDetail) => {
    console.log(err);
    eventEmitter.emit("im_update_audio_msg", {
      isPlaying: false,
      index: currentIndex,
    });
  };

  //音频播放
  const audioPlay = () => {
    if (audioRef.current) audioRef.current.destroy();
    audioRef.current = Taro.createInnerAudioContext();
    //设置状态
    eventEmitter.emit("im_update_audio_msg", {
      isPlaying: true,
      index: currentIndex,
    });

    audioRef.current.autoplay = true;
    audioRef.current.src = message.payload.url;
    audioRef.current.play();

    audioRef.current.onEnded(audioEnded);
    audioRef.current.onError(errorHandle);
  };

  // 音频停止
  const audioStop = () => {
    console.log("音频停止");
    eventEmitter.emit("im_update_audio_msg", {
      isPlaying: false,
      index: currentIndex,
    });

    audioRef.current?.stop();
    audioRef.current?.onStop(stopHandle);
  };

  return (
    <Block>
      <View className={`audio-message ${isMine ? "my-audio" : ""}`}>
        {!message.isPlaying ? (
          <View className="audio" onClick={audioPlay} data-id={message.ID}>
            <Image
              className={`image ${isMine ? "my-image" : ""}`}
              src={pictures.audioMsg}
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
              src={pictures.audioPlay}
            />
            {renderDom[0].second}s
          </View>
        )}
      </View>
    </Block>
  );
};

export default AudioMsg;
