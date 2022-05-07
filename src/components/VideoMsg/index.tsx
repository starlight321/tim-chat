import { memo, useMemo, useState } from "react";
import Taro from "@tarojs/taro";
import { Video, View } from "@tarojs/components";
import { parseVideo } from "@/utils/message-facade";
import "./index.scss";

type Props = {
  message: any;
  isMine: boolean;
};

export default memo<Props>(({ message, isMine = true }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const renderDom = useMemo(() => {
    return parseVideo(message || {});
  }, [message]);

  const showVideoFullScreenChange = (event) => {
    setIsFullscreen(event.detail.fullScreen);
  };

  const handleLongPress = () => {
    if (isFullscreen) {
      Taro.showModal({
        content: "确认保存该视频？",
        success: (rs) => {
          if (rs.confirm) {
            Taro.downloadFile({
              url: message.payload.videoUrl,
              success(res) {
                // 只要服务器有响应数据，就会把响应内容写入文件并进入 success 回调，业务需要自行判断是否下载到了想要的内容
                if (res.statusCode === 200) {
                  Taro.saveVideoToPhotosAlbum({
                    filePath: res.tempFilePath,
                    success() {
                      Taro.showToast({
                        title: "保存成功!",
                        duration: 800,
                        icon: "none",
                      });
                    },
                  });
                }
              },
              fail() {
                Taro.showToast({
                  title: "保存失败!",
                  duration: 800,
                  icon: "none",
                });
              },
            });
          }
        },
      });
    }
  };

  return (
    <View className="video-message">
      <Video
        className={`video-box ${isMine ? "my-video" : ""}`}
        src={renderDom[0].src}
        poster={message.payload.thumbUrl}
        onFullscreenChange={showVideoFullScreenChange}
        onLongPress={handleLongPress}
      />
    </View>
  );
});
