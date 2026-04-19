import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LLMGenerateResult {
  content: string;
  model: string;
  tokensUsed: number;
}

export interface LLMBackend {
  generate(systemPrompt: string, userPrompt: string): Promise<LLMGenerateResult>;
}

class GrokLLMBackend implements LLMBackend {
  private readonly logger = new Logger('GrokLLMBackend');
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('GROK_API_KEY') ?? '';
    this.model = config.get<string>('GROK_MODEL') ?? 'grok-3-mini-fast';
    this.baseUrl = config.get<string>('GROK_BASE_URL') ?? 'https://api.x.ai/v1';

    if (!this.apiKey) {
      throw new Error('GROK_API_KEY is required when AI_PROVIDER=grok');
    }
    this.logger.log(`Grok backend initialized (model=${this.model})`);
  }

  async generate(systemPrompt: string, userPrompt: string): Promise<LLMGenerateResult> {
    const url = `${this.baseUrl}/chat/completions`;

    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 2048,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err: unknown) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Story generation timed out. Please try again.');
      }
      throw new Error(`Failed to connect to AI service: ${(err as Error).message}`);
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => 'unknown');
      this.logger.error(`Grok API error ${res.status}: ${errText}`);
      throw new Error(`Grok API returned ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    if (!choice?.message?.content) {
      throw new Error('Grok API returned empty response');
    }

    return {
      content: choice.message.content,
      model: data.model ?? this.model,
      tokensUsed: data.usage?.total_tokens ?? 0,
    };
  }
}

/**
 * Mock LLM backend for development and testing.
 * Returns realistic-looking structured JSON without calling any external API.
 */
class MockLLMBackend implements LLMBackend {
  async generate(systemPrompt: string, userPrompt: string): Promise<LLMGenerateResult> {
    await new Promise((r) => setTimeout(r, 200));

    const isFinalTurn = systemPrompt.includes('final turn');
    const turnMatch = systemPrompt.match(/TURN:\s*(\d+)/);
    const turn = turnMatch ? parseInt(turnMatch[1], 10) : 1;

    const modeMatch = systemPrompt.match(/STORY MODE:\s*(\w+)/);
    const mode = modeMatch ? modeMatch[1].toLowerCase() : 'bedtime';

    const langMatch = systemPrompt.match(/LANGUAGE:\s*Respond entirely in "(\w+)"/);
    const lang = langMatch ? langMatch[1] : 'en';

    const text = this.generateMockText(mode, turn, userPrompt, lang);
    const isEnding = isFinalTurn || turn > 18;

    const choiceLabels = this.getLocalizedChoices(lang, turn);

    const response = {
      text,
      choices: isEnding
        ? []
        : choiceLabels,
      animationCues: this.generateAnimationCues(mode, turn, isEnding),
      subtitles: this.generateSubtitles(text),
      isEnding,
    };

    return {
      content: JSON.stringify(response),
      model: 'mock-v1',
      tokensUsed: text.length,
    };
  }

  private generateMockText(mode: string, turn: number, userInput: string, lang: string): string {
    const texts = this.getModeTexts(mode, lang);
    const base = texts[turn % texts.length];
    const continuation = this.getContinuation(lang, userInput);
    return `${base}\n\n${continuation}`;
  }

  private getModeTexts(mode: string, lang: string): string[] {
    const allTexts: Record<string, Record<string, string[]>> = {
      bedtime: {
        en: [
          'The little rabbit hopped through the moonlit meadow, each soft step quieter than the last. "Shh," whispered the wind, "the stars are listening!"',
          'Stars twinkled overhead like tiny lanterns hung by the wind itself. A sleepy owl blinked from the banyan tree... "Who goes there?"',
          'A gentle breeze carried the scent of jasmine as the forest creatures settled in for the night. Everything was so peaceful!',
        ],
        hi: [
          'छोटा खरगोश चाँदनी में नहाई हुई घास पर उछलता हुआ चला। "शश्श," हवा ने फुसफुसाया, "तारे सुन रहे हैं!"',
          'आसमान में तारे झिलमिला रहे थे जैसे हवा ने छोटे-छोटे दीपक टाँग दिए हों। बरगद पर बैठा उल्लू बोला... "कौन है वहाँ?"',
          'चमेली की मीठी खुशबू हवा में तैर रही थी जब जंगल के सारे जानवर सो रहे थे। सब कुछ कितना शांत था!',
        ],
        ta: [
          'சிறிய முயல் நிலவொளியில் குதித்துச் சென்றது. "ஷ்ஷ்," காற்று கிசுகிசுத்தது, "நட்சத்திரங்கள் கேட்கின்றன!"',
          'வானில் நட்சத்திரங்கள் சிறிய விளக்குகள் போல் மின்னின. ஆந்தை கண்களை சிமிட்டியது... "யார் அங்கே?"',
          'மல்லிகை மணம் காற்றில் மிதந்தது, காட்டு விலங்குகள் அமைதியாக உறங்கின. எல்லாம் அமைதியாக இருந்தது!',
        ],
      },
      warrior_success: {
        en: [
          'Arjun tightened his grip on the wooden training sword, eyes blazing! "Today, I fight not just with strength — but with heart!" he roared.',
          'With a thunderous cry, the young warrior charged forward. The ground trembled beneath his feet! Could anyone stop this force?',
          'The crowd erupted in deafening cheers! "Victory! Victory!" they chanted as the final obstacle crumbled beneath sheer willpower.',
        ],
        hi: [
          'अर्जुन ने लकड़ी की तलवार मजबूती से पकड़ी, आँखों में आग थी! "आज मैं सिर्फ ताकत से नहीं — दिल से लड़ूँगा!" उसने गरजकर कहा।',
          'एक जोरदार ललकार के साथ युवा योद्धा आगे बढ़ा। ज़मीन उसके कदमों से काँप उठी! क्या कोई रोक सकता है इस शक्ति को?',
          'भीड़ ने जोर-जोर से नारे लगाए! "जीत! जीत!" सबने गाया जब आखिरी बाधा टूट गई — केवल इच्छाशक्ति से!',
        ],
        ta: [
          'அர்ஜுன் மரப்பயிற்சி வாளை இறுக்கமாகப் பிடித்தான், கண்களில் நெருப்பு! "இன்று நான் வலிமையால் மட்டுமல்ல — இதயத்தால் போராடுவேன்!"',
          'இடி முழக்கத்துடன் இளம் வீரன் முன்னேறினான். பூமி அவன் காலடியில் நடுங்கியது! யாரால் இந்த சக்தியை நிறுத்த முடியும்?',
          'கூட்டம் ஆர்ப்பரித்தது! "வெற்றி! வெற்றி!" என்று முழங்கியது, கடைசி தடையும் உடைந்தது!',
        ],
      },
      mythology: {
        en: [
          'Lord Ganesha sat beneath the great banyan tree, his eyes twinkling with ancient wisdom. "Every obstacle," he smiled, "is a doorway in disguise!"',
          'The river Saraswati shimmered like liquid gold as Sage Narada strummed his veena. "Listen carefully," he whispered, "for dharma speaks in riddles..."',
          'In the golden kingdom of Lanka, a fateful moment arrived. The wind held its breath... What would change the course of history forever?',
        ],
        hi: [
          'भगवान गणेश विशाल बरगद के नीचे बैठे थे, उनकी आँखों में प्राचीन ज्ञान चमक रहा था। "हर बाधा," वे मुस्कुराए, "एक छुपा हुआ द्वार है!"',
          'सरस्वती नदी सोने जैसी चमक रही थी जब नारद मुनि ने वीणा बजाई। "ध्यान से सुनो," उन्होंने कहा, "धर्म पहेलियों में बोलता है..."',
          'सोने की लंका में एक निर्णायक पल आया। हवा ने साँस रोक ली... क्या बदल जाएगा इतिहास हमेशा के लिए?',
        ],
        ta: [
          'விநாயகர் பெரிய ஆல மரத்தின் கீழ் அமர்ந்திருந்தார். "ஒவ்வொரு தடையும்," அவர் புன்னகைத்தார், "ஒரு மறைந்த வாசல்!"',
          'சரஸ்வதி நதி தங்கம் போல் ஒளிர்ந்தது, நாரதர் வீணை மீட்டினார். "கவனமாகக் கேளுங்கள்," என்றார், "தர்மம் புதிர்களில் பேசுகிறது..."',
          'பொன்னான இலங்கை நகரில் ஒரு முக்கிய தருணம் வந்தது. காற்று மூச்சைப் பிடித்தது... வரலாற்றை மாற்றும் தருணம் இதுவா?',
        ],
      },
      motivation: {
        en: [
          'Maya stared at the rejection letter, then slowly folded it. "One more no? Fine," she whispered, her eyes burning with quiet determination. "I will show them all!"',
          'Every morning at 4 AM, the light flickered on. While the world slept, she practiced — again and again and again! Nothing could break her spirit.',
          'The village laughed when she said she would study at IIT. But Maya just smiled... "Let my results speak." And speak they would!',
        ],
        hi: [
          'माया ने रिजेक्शन लेटर को देखा, फिर धीरे-धीरे मोड़ दिया। "एक और ना? ठीक है," उसने फुसफुसाया, आँखों में दृढ़ निश्चय था। "मैं सबको दिखा दूँगी!"',
          'हर सुबह 4 बजे, एक छोटी सी बत्ती जलती। जब दुनिया सो रही थी, वो अभ्यास करती — बार-बार, बार-बार! कुछ भी उसका हौसला नहीं तोड़ सकता था।',
          'गाँव वालों ने हँसा जब उसने कहा कि वो IIT जाएगी। लेकिन माया बस मुस्कुराई... "मेरे नतीजे बोलेंगे।" और बोले भी!',
        ],
        ta: [
          'மாயா நிராகரிப்பு கடிதத்தைப் பார்த்தாள், மெதுவாக மடித்தாள். "மேலும் ஒரு இல்லை? சரி," என்றாள், கண்களில் உறுதி! "நான் எல்லோருக்கும் காட்டுவேன்!"',
          'ஒவ்வொரு நாளும் அதிகாலை 4 மணிக்கு விளக்கு எரிந்தது. உலகம் தூங்கும்போது அவள் பயிற்சி செய்தாள் — மீண்டும் மீண்டும்! எதுவும் அவளை தடுக்க முடியாது.',
          'அவள் IIT-யில் படிப்பேன் என்றபோது கிராமம் சிரித்தது. ஆனால் மாயா சிரித்தாள்... "என் முடிவுகள் பேசும்." பேசவும் செய்யும்!',
        ],
      },
    };

    const modeData = allTexts[mode] ?? allTexts.bedtime;
    return modeData[lang] ?? modeData.en;
  }

  private getContinuation(lang: string, userInput: string): string {
    const continuations: Record<string, string> = {
      en: `The path ahead seemed to respond to the choice: "${userInput}". What would happen next was anyone's guess... but the journey was far from over!`,
      hi: `आगे का रास्ता इस चुनाव पर प्रतिक्रिया दे रहा था: "${userInput}"। अब क्या होगा — यह कोई नहीं जानता... लेकिन यह सफर अभी बाकी है!`,
      ta: `முன்னால் உள்ள பாதை இந்த தேர்வுக்கு பதிலளித்தது: "${userInput}". என்ன நடக்கும் என்று யாருக்கும் தெரியாது... ஆனால் பயணம் முடியவில்லை!`,
    };
    return continuations[lang] ?? continuations.en;
  }

  private getLocalizedChoices(lang: string, turn: number): Array<{ choiceId: string; label: string; hint: string; icon: string }> {
    const allChoices: Record<string, Array<{ label: string; hint: string; icon: string }>> = {
      en: [
        { label: 'Follow the mysterious path', hint: 'A hidden trail beckons', icon: '🌿' },
        { label: 'Talk to the wise elder', hint: 'Seek ancient guidance', icon: '🧓' },
        { label: 'Cross the river bravely', hint: 'A daring adventure', icon: '🌊' },
      ],
      hi: [
        { label: 'रहस्यमय रास्ते पर चलो', hint: 'एक छुपा हुआ रास्ता बुला रहा है', icon: '🌿' },
        { label: 'बुजुर्ग से बात करो', hint: 'प्राचीन ज्ञान की खोज', icon: '🧓' },
        { label: 'नदी पार करो', hint: 'एक साहसिक कदम', icon: '🌊' },
      ],
      ta: [
        { label: 'மர்ம பாதையில் செல்', hint: 'மறைந்த பாதை அழைக்கிறது', icon: '🌿' },
        { label: 'பெரியவரிடம் பேசு', hint: 'பழங்கால வழிகாட்டல்', icon: '🧓' },
        { label: 'நதியைக் கடக்க', hint: 'ஒரு துணிச்சலான சாகசம்', icon: '🌊' },
      ],
    };

    const choices = allChoices[lang] ?? allChoices.en;
    return choices.map((c, i) => ({
      choiceId: `choice-${turn}-${String.fromCharCode(97 + i)}`,
      ...c,
    }));
  }

  private generateAnimationCues(mode: string, turn: number, isEnding: boolean) {
    const expressionSets: Record<string, string[][]> = {
      bedtime: [
        ['calm', 'smile', 'love'],
        ['wonder', 'calm', 'smile'],
        ['thinking', 'love', 'calm'],
      ],
      warrior_success: [
        ['determined', 'excited', 'proud'],
        ['angry', 'determined', 'excited'],
        ['surprised', 'proud', 'laugh'],
      ],
      mythology: [
        ['wonder', 'thinking', 'smile'],
        ['curious', 'surprised', 'wonder'],
        ['calm', 'wonder', 'love'],
      ],
      motivation: [
        ['sad', 'determined', 'proud'],
        ['thinking', 'excited', 'proud'],
        ['determined', 'smile', 'laugh'],
      ],
    };

    const sets = expressionSets[mode] ?? expressionSets.bedtime;
    const expressions = sets[turn % sets.length];

    if (isEnding) {
      return [
        { timestampMs: 0, durationMs: 2000, type: 'expression', value: 'smile', intensity: 0.9 },
        { timestampMs: 2500, durationMs: 2000, type: 'expression', value: 'love', intensity: 1.0 },
        { timestampMs: 5000, durationMs: 2000, type: 'expression', value: 'proud', intensity: 0.8 },
      ];
    }

    return [
      { timestampMs: 0, durationMs: 2000, type: 'expression', value: expressions[0], intensity: 0.7 + (turn % 3) * 0.1 },
      { timestampMs: 2500, durationMs: 1500, type: 'gesture', value: 'point_forward', intensity: 0.6 },
      { timestampMs: 4500, durationMs: 2000, type: 'expression', value: expressions[1], intensity: 0.8 },
      { timestampMs: 7000, durationMs: 1500, type: 'expression', value: expressions[2], intensity: 0.9 },
    ];
  }

  private generateSubtitles(text: string): Array<{ startMs: number; endMs: number; text: string }> {
    const words = text.split(/\s+/);
    const segments: Array<{ startMs: number; endMs: number; text: string }> = [];
    const wordsPerSegment = 7;
    let offsetMs = 0;

    for (let i = 0; i < words.length; i += wordsPerSegment) {
      const chunk = words.slice(i, i + wordsPerSegment).join(' ');
      const duration = 2500;
      segments.push({ startMs: offsetMs, endMs: offsetMs + duration, text: chunk });
      offsetMs += duration;
    }

    return segments;
  }
}

@Injectable()
export class StoryLLMService {
  private readonly logger = new Logger(StoryLLMService.name);
  private backend: LLMBackend;

  constructor(private readonly config: ConfigService) {
    const provider = this.config.get<string>('app.aiProvider') ?? 'mock';
    this.backend = this.createBackend(provider);
    this.logger.log(`Story LLM backend: ${provider}`);
  }

  async generate(systemPrompt: string, userPrompt: string): Promise<LLMGenerateResult> {
    return this.backend.generate(systemPrompt, userPrompt);
  }

  private createBackend(provider: string): LLMBackend {
    switch (provider) {
      case 'mock':
        return new MockLLMBackend();

      case 'grok':
        return new GrokLLMBackend(this.config);

      case 'openai':
        throw new Error('OpenAI backend not yet implemented');

      case 'anthropic':
        throw new Error('Anthropic backend not yet implemented');

      default:
        this.logger.warn(`Unknown AI provider "${provider}", falling back to mock`);
        return new MockLLMBackend();
    }
  }
}
