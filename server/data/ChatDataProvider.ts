import axios from 'axios';
export default class ChatDataProvider {
  static provider = null;

  static getProviderInstance() {
    if (ChatDataProvider.provider == null) {
      ChatDataProvider.provider = new ChatDataProvider();
    }
    return ChatDataProvider.provider;
  }

  async getAudioToText(audioUrl) {
    return new Promise(async(resolve, reject) => {
      console.log('audio----',audioUrl)
      const config = {
        url: 'https://api.replicate.com/v1/predictions',
        headers: {
            'Authorization': 'Token 0a0ad1c1eb969733595072bffcc4b99d73a79b95',
            'Content-Type': 'application/json'
        },
        data: null,
    };
      const data = JSON.stringify({
          "version": "b6e7ea7aef18444c29d974fee51ffc1e47e1699cfaf4e5cde0ba47a8db74f3b6",
          "input": {
              "audio": "https://files.boardx.us/YRsojk24twmHD7NHq/default/fiaqdijFggjPdQyCF/record/yMhDBAvbdyfFPEn8E/1677484554285.mp3",
              "model": "base", //Allowed values:tiny, base, small, medium, large
              "transcription": "plain text", //Allowed values:plain text, srt, vtt
              "translate": false, //Translate the text to English when set to True
              "temperature": 0, //temperature to use for sampling 0
              "suppress_tokens": "-1",
              "condition_on_previous_text": true,
              "temperature_increment_on_fallback": 0.2,
              "compression_ratio_threshold": 2.4,
              "logprob_threshold": -1,
              "no_speech_threshold": 0.6,
          }
      });

    await axios.post(config.url, data, { headers: config.headers }).then(response => {
        console.log('resultUrl---',response)
        let result=JSON.parse(response.data);
        console.log('resultUrl---',result)
        let resultUrl = result.urls.get
        axios.get(resultUrl,{ headers: config.headers }).then(response => {
          console.log('response.data---',JSON.parse(response.data))
          resolve(JSON.parse(response.data));
        })
        .catch(error => {
          reject(error);
        });
      })
      .catch(error => {
          reject(error);
      });
  })
  }


}
