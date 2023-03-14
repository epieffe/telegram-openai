
import { Configuration, CreateChatCompletionRequest, OpenAIApi } from 'openai';
import { ChatResponse, DrawResponse } from './interfaces';

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

function buildChatRequest(input_text: string): CreateChatCompletionRequest {
  return {
    model: "gpt-3.5-turbo",
    messages: [
      {"role": "system", "content": "Sei un assistente virtuale."},
      {"role": "user", "content": input_text}
    ]
  };
}

export async function chat(input_text: string): Promise<ChatResponse> {
	try {
    const response = await openai.createChatCompletion(buildChatRequest(input_text));
    const message = response.data.choices[0].message?.content;
    return {
      status: 200,
      message: message || JSON.stringify(response.data.choices[0])
    }

  } catch(error) {
    error = unwrapError(error);
    console.error(`Error while retrieving chat response for message=${input_text} status=${error.status} error=${error.message}`);
    return error;
  }
}

export async function draw(input_text: string): Promise<DrawResponse> {
  try {
    const response = await openai.createImage({
      prompt: input_text,
      n: 4,
      size: "256x256",
    });
    const images = response.data.data.map(img => img.url);
    return { status: 200, images: images}
  } catch(error) {
    error = unwrapError(error)
    console.error(`Error while retrieving draw response for message=${input_text} status=${error.status} error=${error.message}`);
    return error;
  }
}

function unwrapError(error) {
  const message = error.response?.data?.error?.message;
    if (message) {
      const status = error.response.status;
      return { status, message };
    } else {
      return { message: `Unknown error: ${JSON.stringify(error)}` };
    }
}
