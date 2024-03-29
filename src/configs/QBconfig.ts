export const QBConfig = {
  credentials: {
    appId: Number(process.env.REACT_APP_QB_APP_ID!),
    accountKey: process.env.REACT_APP_QB_ACCOUNT_KEY!,
    authKey: '',
    authSecret: '',
    sessionToken: '',
  },
  configAIApi: {
    AIAnswerAssistWidgetConfig: {
      organizationName: 'Quickblox',
      openAIModel: 'gpt-3.5-turbo',
      apiKey: '',
      maxTokens: 3584,
      useDefault: true,
      proxyConfig: {
        api: 'v1/chat/completions',
        servername: process.env.REACT_APP_API_BASE_URL!,
        port: '',
      },
    },
    AITranslateWidgetConfig: {
      organizationName: 'Quickblox',
      openAIModel: 'gpt-3.5-turbo',
      apiKey: '',
      maxTokens: 3584,
      useDefault: true,
      defaultLanguage: 'Ukrainian',
      languages: ['Ukrainian', 'English', 'French', 'Portuguese', 'German'],
      proxyConfig: {
        api: 'v1/chat/completions',
        servername: process.env.REACT_APP_API_BASE_URL!,
        port: '',
      },
    },
    AIRephraseWidgetConfig: {
      organizationName: 'Quickblox',
      openAIModel: 'gpt-3.5-turbo',
      apiKey: '',
      maxTokens: 3584,
      useDefault: true,
      defaultTone: 'Professional',
      Tones: [
        {
          name: 'Professional Tone',
          description:
            'This would edit messages to sound more formal, using technical vocabulary, clear sentence structures, and maintaining a respectful tone. It would avoid colloquial language and ensure appropriate salutations and sign-offs',
          iconEmoji: '👔',
        },
        {
          name: 'Friendly Tone',
          description:
            'This would adjust messages to reflect a casual, friendly tone. It would incorporate casual language, use emoticons, exclamation points, and other informalities to make the message seem more friendly and approachable.',
          iconEmoji: '🤝',
        },
        {
          name: 'Encouraging Tone',
          description:
            'This tone would be useful for motivation and encouragement. It would include positive words, affirmations, and express support and belief in the recipient.',
          iconEmoji: '💪',
        },
        {
          name: 'Empathetic Tone',
          description:
            'This tone would be utilized to display understanding and empathy. It would involve softer language, acknowledging feelings, and demonstrating compassion and support.',
          iconEmoji: '🤲',
        },
        {
          name: 'Neutral Tone',
          description:
            'For times when you want to maintain an even, unbiased, and objective tone. It would avoid extreme language and emotive words, opting for clear, straightforward communication.',
          iconEmoji: '😐',
        },
        {
          name: 'Assertive Tone',
          description:
            'This tone is beneficial for making clear points, standing ground, or in negotiations. It uses direct language, is confident, and does not mince words.',
          iconEmoji: '🔨',
        },
        {
          name: 'Instructive Tone',
          description:
            'This tone would be useful for tutorials, guides, or other teaching and training materials. It is clear, concise, and walks the reader through steps or processes in a logical manner.',
          iconEmoji: '📖',
        },
        {
          name: 'Persuasive Tone',
          description:
            'This tone can be used when trying to convince someone or argue a point. It uses persuasive language, powerful words, and logical reasoning.',
          iconEmoji: '☝️',
        },
        {
          name: 'Sarcastic/Ironic Tone',
          description:
            'This tone can make the communication more humorous or show an ironic stance. It is harder to implement as it requires the AI to understand nuanced language and may not always be taken as intended by the reader.',
          iconEmoji: '😏',
        },
        {
          name: 'Poetic Tone',
          description:
            'This would add an artistic touch to messages, using figurative language, rhymes, and rhythm to create a more expressive text.',
          iconEmoji: '🎭',
        },
      ],
      proxyConfig: {
        api: 'v1/chat/completions',
        servername: process.env.REACT_APP_API_BASE_URL!,
        port: '',
      },
    },
  },
  appConfig: {
    maxFileSize: 10 * 1024 * 1024,
    sessionTimeOut: 122,
    chatProtocol: {
      active: 2,
    },
    debug: true,
    enableForwarding: true,
    enableReplying: true,
    regexUserName: '^(?=[a-zA-Z])[-a-zA-Z_ ]{3,49}(?<! )$',
    endpoints: {
      api: process.env.REACT_APP_QB_ENDPOINT_API!,
      chat: process.env.REACT_APP_QB_ENDPOINT_CHAT!,
    },
    streamManagement: {
      enable: true,
    },
  },
}
