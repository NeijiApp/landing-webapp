/**
 * LLM-based Parameter Parser for Meditation Requests
 * Uses a small, cheap LLM to intelligently extract explicit parameters from user input
 */

import { openai } from "../services/openrouter";

export interface ParsedMeditationParams {
  duration?: number; // in minutes
  goal?: 'calm' | 'focus' | 'sleep' | 'energy' | 'healing' | 'stress' | 'anxiety';
  voiceGender?: 'male' | 'female';
  voiceStyle?: 'calm' | 'energetic' | 'soothing' | 'focused';
  guidanceLevel?: 'beginner' | 'confirmed' | 'expert';
  background?: 'silence' | 'nature' | 'ambient' | 'waves' | 'rain' | 'focus' | 'relax';
  confidence: number; // 0-1 score of how confident the parser is
  detectedParams: string[]; // List of which parameters were explicitly mentioned
  reasoning: string; // Explanation of what was detected and why
}

export class LLMParameterParser {
  private model = "openai/gpt-4o-mini"; // Small, cheap, and effective

  /**
   * Intelligently parse user input to infer optimal meditation parameters
   * Uses context, meditation best practices, and user psychology to make smart inferences
   * Only called when user provides custom input for meditation generation
   */
  async parseUserInput(userInput: string): Promise<ParsedMeditationParams> {
    const systemPrompt = `You are an intelligent meditation parameter inference specialist. Your job is to analyze user input and intelligently infer the most appropriate meditation parameters based on context, user intent, and common meditation practices.

SMART INFERENCE RULES:
1. Extract explicit parameters mentioned by the user
2. Intelligently infer missing parameters based on context and coherence
3. Make reasonable assumptions that create the best meditation experience
4. Consider the relationship between parameters (e.g., sleep goal + calm voice + longer duration)
5. Use meditation best practices and user psychology to guide inferences

PARAMETER INFERENCE LOGIC:

DURATION:
- Focus/work: 3-10 minutes (needs time to settle)
- Sleep: 10-15 minutes (time to unwind)
- Quick relief: 3 minutes
- Deep practice: 15-25 minutes
- Short: 3 minutes
- Long: 10 minutes
- No explicit duration: infer based on goal and context

GOAL:
- "focus/concentration/work/study" → "focus"
- "sleep/rest/insomnia/bedtime" → "sleep"
- "stress/anxiety/worry" → "calm" or "stress"
- "energy/motivation/awake" → "energy"
- "pain/healing/recovery" → "healing"
- "peace/calm/relax" → "calm"
- Generic meditation → infer from emotional state or time of day

VOICE GENDER:
- "male/man/guy/deep" → "male"
- "female/woman/lady/soft" → "female"
- No preference → consider goal (male for focus/authority, female for calm/soothing)

VOICE STYLE:
- Sleep: "calm", "soothing", "gentle"
- Focus: "focused", "clear", "energetic"
- Stress: "calm", "soothing", "gentle"
- Energy: "energetic", "dynamic", "motivated"
- Healing: "soothing", "gentle", "calm"

GUIDANCE LEVEL:
- "beginner/new/first time/simple" → "beginner"
- "expert/advanced/minimal guidance" → "expert"
- Default: "confirmed" for balanced experience

BACKGROUND:
- Sleep: "rain", "waves", "silence"
- Focus: "silence", "focus", "ambient"
- Calm: "nature", "waves", "ambient"
- Energy: "silence", "focus"

RESPONSE FORMAT:
Respond with a JSON object containing:
{
  "duration": number | null,
  "goal": "calm|focus|sleep|energy|healing|stress|anxiety" | null,
  "voiceGender": "male|female" | null,
  "voiceStyle": "calm|energetic|soothing|focused" | null,
  "guidanceLevel": "beginner|confirmed|expert" | null,
  "background": "silence|nature|ambient|waves|rain|focus|relax" | null,
  "confidence": 0.0-1.0,
  "detectedParams": ["param1", "param2"],
  "reasoning": "Explanation of inferences and why they fit together"
}

SMART EXAMPLES:

Input: "I need to focus for work"
Output: {"duration": 8, "goal": "focus", "voiceGender": "male", "voiceStyle": "focused", "guidanceLevel": "confirmed", "background": "silence", "confidence": 0.9, "detectedParams": ["goal"], "reasoning": "Work focus needs structured guidance with clear male voice, 8min for optimal concentration, silence to minimize distractions"}

Input: "Help me sleep"
Output: {"duration": 12, "goal": "sleep", "voiceGender": "female", "voiceStyle": "soothing", "guidanceLevel": "beginner", "background": "rain", "confidence": 0.85, "detectedParams": ["goal"], "reasoning": "Sleep meditation benefits from moderate duration, gentle female voice, rain sounds for white noise, simple guidance"}

Input: "Feeling stressed"
Output: {"duration": 8, "goal": "calm", "voiceGender": "female", "voiceStyle": "calm", "guidanceLevel": "confirmed", "background": "waves", "confidence": 0.8, "detectedParams": [], "reasoning": "Stress relief needs calming approach with soothing female voice, wave sounds for relaxation, moderate duration"}

Input: "Quick meditation"
Output: {"duration": 3, "goal": "calm", "voiceGender": "female", "voiceStyle": "calm", "guidanceLevel": "confirmed", "background": "silence", "confidence": 0.75, "detectedParams": ["duration"], "reasoning": "Quick session suggests very short duration, calm voice for immediate stress relief"}

Input: "I want a short, meditation to wake up, male voice"
Output: {"duration": 3, "goal": "energy", "voiceGender": "male", "voiceStyle": "energetic", "guidanceLevel": "confirmed", "background": "silence", "confidence": 0.9, "detectedParams": ["duration", "goal", "voiceGender"], "reasoning": "Short wake-up meditation needs male voice for energy, quick duration to boost alertness, energetic style to stimulate wakefulness"}`;

    const userPrompt = `Analyze this meditation request and infer the most appropriate parameters: "${userInput}"

Consider the user's intent, emotional state, and what would create the best meditation experience. Make intelligent inferences based on meditation best practices and psychological principles.`;

    try {
      console.log('🤖 Using LLM to parse user input:', userInput);
      
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1, // Low temperature for consistent, precise extraction
        max_tokens: 500,
      });

      if ("choices" in response && response.choices[0]?.message?.content) {
        const content = response.choices[0].message.content;
        
        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as ParsedMeditationParams;
          
          console.log('✅ LLM parsing result:', {
            detectedParams: parsed.detectedParams,
            confidence: parsed.confidence,
            reasoning: parsed.reasoning
          });
          
          return parsed;
        }
      }
      
      throw new Error("Failed to parse LLM response");
      
    } catch (error) {
      console.error("❌ LLM parameter parsing failed:", error);
      
      // Return empty result on failure
      return {
        confidence: 0,
        detectedParams: [],
        reasoning: "Failed to parse user input",
      };
    }
  }

  /**
   * Merge parsed parameters with explicit defaults
   * Parsed parameters take priority over defaults
   */
  mergeWithDefaults(
    parsed: ParsedMeditationParams,
    defaults: {
      duration: number;
      goal: string;
      voiceGender: 'male' | 'female';
      guidance: string;
      background: string;
    }
  ): {
    finalParams: {
      duration: number;
      goal: string;
      voiceGender: 'male' | 'female';
      voiceStyle: string;
      guidanceLevel: string;
      background: string;
    };
    overrides: string[]; // Which parameters were overridden by user input
  } {
    const overrides: string[] = [];
    
    const finalParams = {
      duration: defaults.duration,
      goal: defaults.goal,
      voiceGender: defaults.voiceGender,
      voiceStyle: 'calm', // Default style
      guidanceLevel: defaults.guidance,
      background: defaults.background,
    };

    // Apply parsed parameters with intelligent inference
    // Since the LLM makes smart inferences, apply them if confidence is reasonable
    if (parsed.duration && (parsed.detectedParams.includes('duration') || parsed.confidence > 0.6)) {
      finalParams.duration = parsed.duration;
      overrides.push('duration');
    }

    if (parsed.goal && (parsed.detectedParams.includes('goal') || parsed.confidence > 0.5)) {
      finalParams.goal = parsed.goal;
      overrides.push('goal');
    }

    if (parsed.voiceGender && (parsed.detectedParams.includes('voiceGender') || parsed.confidence > 0.7)) {
      finalParams.voiceGender = parsed.voiceGender;
      overrides.push('voiceGender');
    }

    if (parsed.voiceStyle && (parsed.detectedParams.includes('voiceStyle') || parsed.confidence > 0.6)) {
      finalParams.voiceStyle = parsed.voiceStyle;
      overrides.push('voiceStyle');
    }

    if (parsed.guidanceLevel && (parsed.detectedParams.includes('guidanceLevel') || parsed.confidence > 0.7)) {
      finalParams.guidanceLevel = parsed.guidanceLevel;
      overrides.push('guidanceLevel');
    }

    if (parsed.background && (parsed.detectedParams.includes('background') || parsed.confidence > 0.6)) {
      finalParams.background = parsed.background;
      overrides.push('background');
    }

    console.log('🔄 Parameter merge complete:', {
      overrides,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning
    });

    return { finalParams, overrides };
  }
}

// Export singleton instance
export const llmParameterParser = new LLMParameterParser();
