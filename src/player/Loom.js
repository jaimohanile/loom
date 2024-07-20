import React, { Component } from 'react'

import { callPlayer } from './utils'
import playerjs from 'player.js';



const MATCH_URL_LOOM = /loom\.com\/(share|embed)\/([a-zA-Z0-9_-]+)(\?[^#]*)?/

const fetchOEmbedData = async (url) => {
  const oEmbedUrl = `https://www.loom.com/v1/oembed?url=${encodeURIComponent(url)}`;

  try {
    const response = await fetch(oEmbedUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch oEmbed data: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching oEmbed data:", error);
    return null;
  }
};

export default class Loom extends Component {
  static displayName = 'Loom'
  static canPlay = (url) => MATCH_URL_LOOM.test(url)
  static forceLoad = true // Prevent checking isLoading when URL changes
  callPlayer = callPlayer
  duration = null
  currentTime = null
  secondsLoaded = null
  constructor(props) {
    super(props);
    this.container = React.createRef();
    this.state = {
      oEmbedData: null,
      secondsLoaded: 0
    };
  }
  componentDidMount() {
    this.props.onMount && this.props.onMount(this)
  }



  load(url) {
    this.duration = null
    fetchOEmbedData(url).then(data => {
      if (data && this.container.current) {
        this.setState({ oEmbedData: data }, () => {
          this.container.current.innerHTML = this.state.oEmbedData.html;
          const iframe = this.container.current.querySelector('iframe');
          iframe.style.width = '100%';
          iframe.style.height = '100%';
          if (iframe) {
            iframe.onload = () => {
              this.player = new playerjs.Player(iframe);
              this.player.on('ready', this.props.onReady);
              this.player.on('loaded', () => {
                this.props.onReady()
                this.refreshDuration()
              })
              this.player.on('play', () => {
                this.props.onPlay()
                this.refreshDuration()
              })
              this.player.on('pause', this.props.onPause)
              this.player.on('seeked', e => this.props.onSeek(e.seconds))
              this.player.on('ended', this.props.onEnded)
              this.player.on('error', this.props.onError)
              this.player.on('timeupdate', ({ seconds }) => {
                this.currentTime = seconds
              })
              this.player.on('progress', ({ seconds }) => {
                this.secondsLoaded = seconds
              })
              this.player.on('bufferstart', this.props.onBuffer)
              this.player.on('bufferend', this.props.onBufferEnd)
              this.player.on('playbackratechange', e => this.props.onPlaybackRateChange(e.playbackRate))
            };
          }
        });
      }
    }, this.props.onError);

  }

  refreshDuration() {
    this.player.getDuration(duration => {
      this.duration = duration
    })
  }

  play() {
    const promise = this.callPlayer('play')
    if (promise) {
      promise.catch(this.props.onError)
    }
  }

  pause() {
    this.callPlayer('pause')
  }

  stop() {
    this.callPlayer('unload')
  }

  seekTo(seconds, keepPlaying = true) {
    this.callPlayer('setCurrentTime', seconds)
    if (!keepPlaying) {
      this.pause()
    }
  }

  setVolume(fraction) {
    this.callPlayer('setVolume', fraction * 100)
  }

  setMuted(muted) {
    this.callPlayer(muted ? 'mute' :'unmute')
  }

  setLoop(loop) {
    this.callPlayer('setLoop', loop)
  }

  setPlaybackRate(rate) {
    this.callPlayer('setPlaybackRate', rate)
  }

  mute = () => {
    this.setMuted(true)
  }

  unmute = () => {
    this.setMuted(false)
  }

  getDuration() {
    return this.duration
  }

  getCurrentTime() {
    return this.currentTime
  }

  getSecondsLoaded() {
    return this.secondsLoaded
  }

  ref = container => {
    this.container = container
  }

  render() {
    const { display } = this.props
    const style = {
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      display
    }
    return (
      <div
        key={this.props.url}
        ref={this.container}
        style={style}
      />
    )
  }
}
