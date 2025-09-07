/**
 * Intelligent Pause Agent - Analyzes meditation content and inserts context-aware pauses
 * Based on analysis of professional meditation scripts with natural pause patterns
 */

export interface PauseAnalysis {
  content: string;
  pauses: Array<{
    position: number;
    duration: number;
    reason: string;
    contentType: string;
  }>;
  totalPauseTime: number;
}

export class IntelligentPauseAgent {

  /**
   * Analyzes meditation content and inserts intelligent pauses
   * Based on the patterns found in professional meditation scripts
   */
  analyzeAndInsertPauses(content: string, context: {
    segmentType: string;
    guidanceLevel: string;
    goal: string;
  }): PauseAnalysis {

    // Split content into sentences for analysis
    const sentences = this.splitIntoSentences(content);
    let enhancedContent = '';
    const pauses: Array<{
      position: number;
      duration: number;
      reason: string;
      contentType: string;
    }> = [];

    let currentPosition = 0;
    let totalPauseTime = 0;

    sentences.forEach((sentence, index) => {
      // Add the sentence
      enhancedContent += sentence;
      currentPosition += sentence.length;

      // Analyze sentence type and determine pause duration
      const analysis = this.analyzeSentenceType(sentence.trim());

      if (analysis.needsPause) {
        const pauseDuration = this.calculatePauseDuration(analysis, context, index, sentences.length);
        const pauseMarker = `[PAUSE:${pauseDuration}]`; // Use clearer format to avoid TTS pronunciation

        enhancedContent += pauseMarker;
        pauses.push({
          position: currentPosition,
          duration: pauseDuration,
          reason: analysis.reason,
          contentType: analysis.type,
        });

        totalPauseTime += pauseDuration;
        currentPosition += pauseMarker.length;
      }

      // Add space between sentences (except for the last one)
      if (index < sentences.length - 1) {
        enhancedContent += ' ';
        currentPosition += 1;
      }
    });

    return {
      content: enhancedContent,
      pauses,
      totalPauseTime,
    };
  }

  /**
   * Splits text into sentences for individual analysis
   */
  private splitIntoSentences(text: string): string[] {
    // Split on sentence endings while preserving the punctuation
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 0)
      .map(s => s.trim());

    return sentences;
  }

  /**
   * Analyzes sentence type to determine pause requirements
   */
  private analyzeSentenceType(sentence: string): {
    type: string;
    needsPause: boolean;
    reason: string;
  } {

    const lowerSentence = sentence.toLowerCase();

    // Breathing instructions - ALWAYS need 3-second pauses
    if (this.containsBreathingInstruction(lowerSentence)) {
      return {
        type: 'breathing',
        needsPause: true,
        reason: 'Breathing instruction requires time for practice',
      };
    }

    // Questions - Need time for reflection
    if (this.containsQuestion(lowerSentence)) {
      return {
        type: 'question',
        needsPause: true,
        reason: 'Question requires time for reflection',
      };
    }

    // Practice instructions - Need time for practice
    if (this.containsPracticeInstruction(lowerSentence)) {
      return {
        type: 'practice',
        needsPause: true,
        reason: 'Practice instruction needs time for execution',
      };
    }

    // Transitions and setup
    if (this.containsTransition(lowerSentence)) {
      return {
        type: 'transition',
        needsPause: true,
        reason: 'Transition needs smooth flow',
      };
    }

    // Instructions and guidance
    if (this.containsInstruction(lowerSentence)) {
      return {
        type: 'instruction',
        needsPause: true,
        reason: 'Instruction needs absorption time',
      };
    }

    // Explanations and concepts
    if (this.containsExplanation(lowerSentence)) {
      return {
        type: 'explanation',
        needsPause: true,
        reason: 'Explanation needs processing time',
      };
    }

    // Default case - still add minimal pause for natural rhythm
    return {
      type: 'default',
      needsPause: true,
      reason: 'Natural speech rhythm',
    };
  }

  /**
   * Calculates optimal pause duration based on content type and context
   */
  private calculatePauseDuration(
    analysis: { type: string; reason: string },
    context: { segmentType: string; guidanceLevel: string; goal: string },
    sentenceIndex: number,
    totalSentences: number
  ): number {

    const baseDurations = {
      breathing: 3,      // Always 3 seconds for breathing
      question: 3,       // Always 3 seconds for reflection
      practice: 2,       // 2 seconds for practice setup
      transition: 2,     // 2 seconds for smooth transitions
      instruction: 2,    // 2 seconds for instructions
      explanation: 3,    // 3 seconds for concepts
      default: 2,        // 2 seconds for natural rhythm
    };

    let duration = baseDurations[analysis.type as keyof typeof baseDurations] || 2;

    // Adjust based on guidance level
    if (context.guidanceLevel === 'beginner') {
      duration = Math.max(duration, 2); // Ensure minimum time for beginners
    } else if (context.guidanceLevel === 'expert') {
      duration = Math.max(duration * 0.8, 1); // Slightly faster for experts
    }

    // Adjust based on goal
    if (context.goal === 'sleep') {
      duration *= 1.2; // Longer pauses for sleep
    } else if (context.goal === 'focus') {
      duration *= 0.9; // Slightly shorter for focus
    }

    // Special handling for practice periods
    if (analysis.type === 'practice' && context.segmentType === 'breathing') {
      duration = 20; // Long pause for breathing practice
    }

    // Special handling for mindfulness observations
    if (analysis.type === 'practice' && context.segmentType === 'mindfulness') {
      duration = 30; // Very long pause for mindfulness practice
    }

    // Round to nearest 0.5 seconds for natural feel
    return Math.round(duration * 2) / 2;
  }

  // Content type detection methods
  private containsBreathingInstruction(text: string): boolean {
    const breathingKeywords = [
      'breathe in', 'breathe out', 'inhale', 'exhale',
      'deep breath', 'slow breath', 'gentle breath',
      'follow your breath', 'notice your breath',
      'breathing in', 'breathing out'
    ];
    return breathingKeywords.some(keyword => text.includes(keyword));
  }

  private containsQuestion(text: string): boolean {
    return text.includes('?') ||
           text.includes('what do you notice') ||
           text.includes('how do you feel') ||
           text.includes('what do you observe');
  }

  private containsPracticeInstruction(text: string): boolean {
    const practiceKeywords = [
      'take a moment', 'pause here', 'sit with',
      'rest in', 'simply observe', 'just notice',
      'let it be', 'allow it to', 'stay with'
    ];
    return practiceKeywords.some(keyword => text.includes(keyword));
  }

  private containsTransition(text: string): boolean {
    const transitionKeywords = [
      'now let\'s', 'let\'s move', 'shift your', 'bring your',
      'turn your', 'move to', 'transition to',
      'now we\'ll', 'next we', 'let\'s begin'
    ];
    return transitionKeywords.some(keyword => text.includes(keyword));
  }

  private containsInstruction(text: string): boolean {
    const instructionKeywords = [
      'close your eyes', 'find a comfortable', 'sit upright',
      'relax your', 'soften your', 'let go of', 'release'
    ];
    return instructionKeywords.some(keyword => text.includes(keyword));
  }

  private containsExplanation(text: string): boolean {
    const explanationKeywords = [
      'mindfulness is', 'this practice', 'it helps',
      'you might notice', 'this is normal', 'the goal is',
      'over time', 'with practice'
    ];
    return explanationKeywords.some(keyword => text.includes(keyword));
  }
}

// Export singleton instance
export const intelligentPauseAgent = new IntelligentPauseAgent();
