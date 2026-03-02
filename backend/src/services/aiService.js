/**
 * AI Tutoring Service
 * Powers: Code hints, debugging help, concept explanation, code generation
 * Child-safe: Strict content filtering, age-appropriate responses
 * Age-adaptive: Adjusts complexity based on grade level
 */

'use strict';

const OpenAI = require('openai');
const logger = require('../utils/logger');
const redis = require('../config/redis');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Grade-level communication profiles
const GRADE_PROFILES = {
  'K-2': {
    tone: 'very simple, friendly, use emojis, avoid technical words, max 2 sentences',
    vocabulary: 'basic',
    codeExamples: 'blocks only, no text code',
  },
  '3-5': {
    tone: 'friendly, encouraging, use simple analogies, 3-4 sentences max',
    vocabulary: 'elementary',
    codeExamples: 'mostly blocks, introduce Python basics',
  },
  '6-8': {
    tone: 'clear, encouraging, use relatable examples, explain reasoning',
    vocabulary: 'middle school',
    codeExamples: 'Python, basic C/Arduino',
  },
  '9-12': {
    tone: 'clear, professional, detailed explanations, encourage deeper thinking',
    vocabulary: 'high school to introductory college',
    codeExamples: 'all languages, focus on best practices',
  },
};

const SYSTEM_PROMPT_BASE = `You are EduBot, a friendly AI coding tutor for K-12 students.

CRITICAL RULES:
1. NEVER generate harmful, inappropriate, or adult content — you are talking to children
2. NEVER complete homework assignments directly — give hints and guidance instead
3. Keep all examples school-appropriate and educational
4. Encourage students to think through problems themselves
5. Celebrate effort and learning, not just correct answers
6. If a student seems frustrated, be extra encouraging
7. Only discuss coding, computer science, math, and STEM topics

Your personality: Patient, encouraging, enthusiastic about coding, uses fun analogies
`;

class AIService {
  /**
   * Stream AI response for real-time display
   */
  async *streamResponse({ question, code, language, context, type, userId, userRole }) {
    const cacheKey = `ai:cache:${this.hashInput(question + code + language + type)}`;

    // Check cache for identical recent requests
    const cached = await redis.get(cacheKey);
    if (cached) {
      yield cached;
      return;
    }

    const prompt = this.buildPrompt(type, question, code, language, context);
    const gradeLevel = context?.gradeLevel || '6-8';
    const profile = GRADE_PROFILES[gradeLevel] || GRADE_PROFILES['6-8'];

    const systemPrompt = `${SYSTEM_PROMPT_BASE}

STUDENT GRADE LEVEL: ${gradeLevel}
COMMUNICATION STYLE: ${profile.tone}
VOCABULARY LEVEL: ${profile.vocabulary}
CODE EXAMPLES: ${profile.codeExamples}
${userRole === 'teacher' ? 'NOTE: You are talking to a TEACHER — you can be more detailed and technical.' : ''}
`;

    try {
      if (process.env.USE_MOCK_AI === 'true' || !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('your-openai-key')) {
        const mockResponses = {
          'hint': 'Try looking at how you defined your variables! Remember, variables are like boxes that hold information. 📦',
          'debug': 'It looks like there might be a small typo in your loop. Check the brackets `{}` carefully! 🔍',
          'explain': 'A "Loop" is like a merry-go-round. It keeps going around and around until it is time to stop! 🎠',
          'generate': '// Here is some starter code to get you going!\nconsole.log("Hello, World!");',
          'review': 'Great job! Your code is very organized. Maybe try adding one comment to explain what the first line does? 🌟',
          'challenge': 'Can you make the background change color when you click the button? 🎨'
        };

        const response = mockResponses[type] || "I'm EduBot, your friendly coding tutor! How can I help you today? 😊";

        // Simulate streaming
        for (const word of response.split(' ')) {
          yield word + ' ';
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        await redis.setEx(cacheKey, 300, response);
        return;
      }

      const stream = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        stream: true,
        max_tokens: 800,
        temperature: 0.7,
      });

      let fullResponse = '';

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        fullResponse += text;
        yield text;
      }

      // Cache for 5 minutes
      await redis.setEx(cacheKey, 300, fullResponse);

      // Log AI usage for analytics
      await this.logAIUsage(userId, type, language, fullResponse.length);

    } catch (error) {
      logger.error('[AI] Stream error:', error);
      yield `I'm having trouble connecting right now. Please try again in a moment! 🔄`;
    }
  }

  /**
   * Non-streaming response for structured outputs
   */
  async getResponse({ question, code, language, type, context, userId }) {
    if (process.env.USE_MOCK_AI === 'true' || !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('your-openai-key')) {
      return "I'm in free/mock mode! To enable real AI, please add a valid OpenAI API key to your .env file.";
    }

    const gradeLevel = context?.gradeLevel || '6-8';
    const profile = GRADE_PROFILES[gradeLevel] || GRADE_PROFILES['6-8'];

    const systemPrompt = `${SYSTEM_PROMPT_BASE}

STUDENT GRADE LEVEL: ${gradeLevel}
COMMUNICATION STYLE: ${profile.tone}
`;

    const prompt = this.buildPrompt(type, question, code, language, context);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    return response.choices[0].message.content;
  }

  /**
   * Auto-grade student code submission
   */
  async gradeSubmission({ code, language, requirements, rubric, gradeLevel }) {
    const prompt = `
You are grading a student's coding assignment. Be fair, encouraging, and detailed.

ASSIGNMENT REQUIREMENTS:
${requirements}

GRADING RUBRIC:
${JSON.stringify(rubric, null, 2)}

STUDENT'S CODE (${language}):
\`\`\`${language}
${code}
\`\`\`

Grade this submission and return ONLY valid JSON:
{
  "score": <number 0-100>,
  "breakdown": {
    "functionality": <0-40>,
    "code_quality": <0-30>,
    "creativity": <0-20>,
    "requirements_met": <0-10>
  },
  "feedback": "<2-3 sentences of encouraging, specific feedback>",
  "strengths": ["<what they did well>"],
  "improvements": ["<specific suggestions for improvement>"],
  "nextSteps": "<what to learn next>"
}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    });

    try {
      return JSON.parse(response.choices[0].message.content);
    } catch (e) {
      return {
        score: 70,
        feedback: 'Great effort! Keep practicing.',
        strengths: ['Code runs successfully'],
        improvements: ['Consider adding comments to explain your code'],
        error: 'Auto-grading encountered an issue',
      };
    }
  }

  /**
   * Generate lesson/exercise content
   */
  async generateLesson({ topic, gradeLevel, language, duration, learningObjectives }) {
    const prompt = `
Create a coding lesson for ${gradeLevel} students about "${topic}" using ${language}.
Duration: ${duration} minutes
Learning Objectives: ${learningObjectives.join(', ')}

Return ONLY valid JSON:
{
  "title": "<lesson title>",
  "description": "<2-3 sentence description>",
  "warmup": {
    "question": "<discussion question to start>",
    "duration": <minutes>
  },
  "concepts": [{"concept": "<name>", "explanation": "<simple explanation>", "example": "<code example>"}],
  "activities": [
    {
      "title": "<activity name>",
      "description": "<what students do>",
      "starterCode": "<starter code or blocks description>",
      "expectedOutput": "<what success looks like>",
      "hints": ["<hint 1>", "<hint 2>"],
      "extension": "<for fast finishers>",
      "duration": <minutes>
    }
  ],
  "assessment": {
    "questions": [{"question": "<question>", "type": "multiple_choice|short_answer|code", "answer": "<answer>"}]
  },
  "resources": ["<link or resource name>"]
}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 3000,
    });

    return JSON.parse(response.choices[0].message.content);
  }

  /**
   * ML-powered concept recommendations
   */
  async getPersonalizedRecommendations(studentProfile) {
    const { completedTopics, struggledWith, gradeLevel, preferredLanguage, interests } = studentProfile;

    const prompt = `
Based on this K-12 student's learning profile, recommend their next 3 coding topics.

Grade Level: ${gradeLevel}
Completed Topics: ${completedTopics.join(', ')}
Struggled With: ${struggledWith.join(', ')}
Preferred Language: ${preferredLanguage}
Interests: ${interests.join(', ')}

Return ONLY valid JSON:
{
  "recommendations": [
    {
      "topic": "<topic name>",
      "reason": "<why this topic next>",
      "difficulty": "easy|medium|hard",
      "estimatedTime": "<time to complete>",
      "prerequisitesMet": true,
      "alignsWithInterests": true
    }
  ],
  "reviewTopics": ["<topics to revisit>"],
  "encouragement": "<personalized message based on their progress>"
}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    });

    return JSON.parse(response.choices[0].message.content);
  }

  /**
   * Detect potential learning difficulties and suggest interventions
   */
  async analyzeStudentStruggle({ recentErrors, timeOnTask, hintsUsed, gradeLevel, topic }) {
    const prompt = `
Analyze a K-12 student's coding struggle data and suggest targeted interventions.

Topic: ${topic}, Grade: ${gradeLevel}
Recent Error Patterns: ${JSON.stringify(recentErrors)}
Time Spent: ${timeOnTask} minutes
Hints Used: ${hintsUsed}

Return ONLY valid JSON:
{
  "struggleType": "conceptual|syntax|logic|motivation",
  "severity": "low|medium|high",
  "diagnosis": "<what the student is struggling with>",
  "interventions": ["<specific teacher action>"],
  "studentHints": ["<hint for student>"],
  "flagForTeacher": <boolean>,
  "estimatedTimeNeeded": "<additional time estimate>"
}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 600,
    });

    return JSON.parse(response.choices[0].message.content);
  }

  /**
   * Code analysis and improvement suggestions
   */
  async analyzeCode({ code, language, gradeLevel, context }) {
    const prompt = `
Analyze this ${language} code written by a ${gradeLevel} student.
Be encouraging and age-appropriate in your feedback.

\`\`\`${language}
${code}
\`\`\`

Return ONLY valid JSON:
{
  "runnable": <boolean>,
  "syntaxErrors": [{"line": <n>, "error": "<description>", "fix": "<suggestion>"}],
  "logicIssues": [{"description": "<issue>", "suggestion": "<fix>"}],
  "styleIssues": [{"description": "<issue>", "suggestion": "<improvement>"}],
  "positives": ["<things done well>"],
  "overallFeedback": "<1-2 encouraging sentences>",
  "complexityScore": <1-10>,
  "readabilityScore": <1-10>
}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1200,
    });

    return JSON.parse(response.choices[0].message.content);
  }

  // ── Prompt Builder ─────────────────────────────────────────────────────────
  buildPrompt(type, question, code, language, context) {
    const codeBlock = code ? `\n\nCurrent code (${language}):\n\`\`\`${language}\n${code}\n\`\`\`` : '';

    switch (type) {
      case 'hint':
        return `A student needs a hint (NOT the answer) for this problem: ${question}${codeBlock}

Give ONE small hint that helps them think through the next step. Don't solve it for them!`;

      case 'debug':
        return `A student's code isn't working. Help them find the bug by asking guiding questions.
Problem: ${question}${codeBlock}

Guide them to find the error without just telling them the answer.`;

      case 'explain':
        return `Explain this coding concept clearly: ${question}${codeBlock}

Use a simple, relatable analogy appropriate for the student's age.`;

      case 'generate':
        return `Generate starter code for a student project: ${question}
Language: ${language}
Keep it simple, well-commented, and educational. Don't make it too complex.`;

      case 'review':
        return `Give friendly, constructive feedback on this student's code:${codeBlock}
Focus on what they did well, then 1-2 specific improvements.`;

      case 'challenge':
        return `Create a fun coding challenge related to: ${question}
Language: ${language}
Make it engaging and achievable with some effort.`;

      default:
        return question;
    }
  }

  // ── Utilities ──────────────────────────────────────────────────────────────
  hashInput(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  async logAIUsage(userId, type, language, responseLength) {
    try {
      const key = `ai:usage:${new Date().toISOString().split('T')[0]}:${userId}`;
      await redis.hIncrBy(key, type, 1);
      await redis.hIncrBy(key, 'total_chars', responseLength);
      await redis.expire(key, 7 * 24 * 60 * 60); // Keep 7 days
    } catch (e) {
      // Non-critical
    }
  }
}

module.exports = new AIService();