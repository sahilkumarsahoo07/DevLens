import { AIProvider } from './AIProvider';
import { ElementData, PageAnalysisData } from '../types';

export class OpenAIProvider implements AIProvider {
  name = 'OpenAI Provider';
  private apiKey: string;
  private endpoint: string;

  constructor(apiKey: string, endpoint?: string) {
    this.apiKey = apiKey;
    this.endpoint = endpoint || 'https://api.openai.com/v1/chat/completions';
  }

  async ask(
    userQuery: string,
    elementContext?: ElementData | null,
    pageContext?: PageAnalysisData | null
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured. Please add your key in DevLens settings.');
    }

    const contextPayload = {
      element: elementContext
        ? {
            tagName: elementContext.tagName,
            selector: elementContext.selector,
            rect: elementContext.rect,
            computedStyles: elementContext.computedStyles,
            typography: elementContext.typography,
            layout: elementContext.layout
          }
        : null,
      page: pageContext
        ? {
            title: pageContext.title,
            url: pageContext.url,
            technologies: pageContext.technologies
          }
        : null
    };

    const messages = [
      {
        role: 'system',
        content:
          'You are DevLens AI, an expert frontend, CSS, UX, and browser engineer assistant. Answer developer questions concisely using clean Markdown code blocks.'
      },
      {
        role: 'user',
        content: `Target Context: ${JSON.stringify(contextPayload)}\n\nUser Question: ${userQuery}`
      }
    ];

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No response returned from OpenAI.';
  }
}
