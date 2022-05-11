import { memo } from "react";
import Taro from "@tarojs/taro";
import { Video } from "@tarojs/components";
import "./index.scss";

export type ImCurrentVideoProps = { videoUrl?: string; thumbUrl?: string };
export default memo<{
  currentVideo: ImCurrentVideoProps;
  resetCurrentVideo(): void;
}>(({ currentVideo, resetCurrentVideo }) => {
  const leaveVideo = (e) => {
    const videoContext = Taro.createVideoContext("im-play-video");
    const fullscreen = e.detail.fullScreen;
    if (!fullscreen) {
      videoContext.pause();
      resetCurrentVideo();
    }
  };

  return (
    <Video
      id="im-play-video"
      className="im-play-video"
      src={currentVideo.videoUrl || ""}
      poster={currentVideo.thumbUrl || ""}
      onFullscreenChange={leaveVideo}
    />
  );
});
