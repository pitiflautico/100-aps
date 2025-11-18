import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Trivia_Quiz_Offline_data';

interface Question {
  id: number;
  category: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface GameStats {
  highScore: number;
  totalPlayed: number;
  totalCorrect: number;
  categoryScores: { [key: string]: number };
}

const CATEGORIES = ['History', 'Science', 'Sports', 'Geography', 'Entertainment'];

const QUESTIONS: Question[] = [
  // History (10 questions)
  { id: 1, category: 'History', question: 'In which year did World War II end?', options: ['1943', '1944', '1945', '1946'], correctAnswer: 2 },
  { id: 2, category: 'History', question: 'Who was the first President of the United States?', options: ['Thomas Jefferson', 'George Washington', 'John Adams', 'Benjamin Franklin'], correctAnswer: 1 },
  { id: 3, category: 'History', question: 'The Great Wall of China was built during which dynasty?', options: ['Ming Dynasty', 'Han Dynasty', 'Qin Dynasty', 'Tang Dynasty'], correctAnswer: 2 },
  { id: 4, category: 'History', question: 'Which ancient wonder was located in Alexandria?', options: ['Colossus of Rhodes', 'Lighthouse of Alexandria', 'Hanging Gardens', 'Statue of Zeus'], correctAnswer: 1 },
  { id: 5, category: 'History', question: 'The French Revolution began in which year?', options: ['1776', '1789', '1792', '1799'], correctAnswer: 1 },
  { id: 6, category: 'History', question: 'Who was the first person to walk on the moon?', options: ['Buzz Aldrin', 'Neil Armstrong', 'Michael Collins', 'Yuri Gagarin'], correctAnswer: 1 },
  { id: 7, category: 'History', question: 'The Roman Empire fell in which century?', options: ['3rd century', '4th century', '5th century', '6th century'], correctAnswer: 2 },
  { id: 8, category: 'History', question: 'Who wrote the Declaration of Independence?', options: ['George Washington', 'John Adams', 'Thomas Jefferson', 'James Madison'], correctAnswer: 2 },
  { id: 9, category: 'History', question: 'The Berlin Wall fell in which year?', options: ['1987', '1988', '1989', '1990'], correctAnswer: 2 },
  { id: 10, category: 'History', question: 'Who was the longest-reigning British monarch?', options: ['Queen Victoria', 'Queen Elizabeth I', 'Queen Elizabeth II', 'King George III'], correctAnswer: 2 },

  // Science (10 questions)
  { id: 11, category: 'Science', question: 'What is the chemical symbol for gold?', options: ['Go', 'Gd', 'Au', 'Ag'], correctAnswer: 2 },
  { id: 12, category: 'Science', question: 'How many planets are in our solar system?', options: ['7', '8', '9', '10'], correctAnswer: 1 },
  { id: 13, category: 'Science', question: 'What is the speed of light?', options: ['300,000 km/s', '150,000 km/s', '450,000 km/s', '600,000 km/s'], correctAnswer: 0 },
  { id: 14, category: 'Science', question: 'What is the largest organ in the human body?', options: ['Heart', 'Liver', 'Brain', 'Skin'], correctAnswer: 3 },
  { id: 15, category: 'Science', question: 'What is the atomic number of carbon?', options: ['4', '6', '8', '12'], correctAnswer: 1 },
  { id: 16, category: 'Science', question: 'Who developed the theory of relativity?', options: ['Isaac Newton', 'Albert Einstein', 'Stephen Hawking', 'Niels Bohr'], correctAnswer: 1 },
  { id: 17, category: 'Science', question: 'What is the boiling point of water in Celsius?', options: ['90°C', '100°C', '110°C', '120°C'], correctAnswer: 1 },
  { id: 18, category: 'Science', question: 'How many bones are in the adult human body?', options: ['186', '206', '226', '246'], correctAnswer: 1 },
  { id: 19, category: 'Science', question: 'What gas do plants absorb from the atmosphere?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], correctAnswer: 2 },
  { id: 20, category: 'Science', question: 'What is the hardest natural substance on Earth?', options: ['Steel', 'Diamond', 'Titanium', 'Obsidian'], correctAnswer: 1 },

  // Sports (10 questions)
  { id: 21, category: 'Sports', question: 'How many players are on a soccer team?', options: ['9', '10', '11', '12'], correctAnswer: 2 },
  { id: 22, category: 'Sports', question: 'In which sport is "love" a score?', options: ['Golf', 'Tennis', 'Cricket', 'Badminton'], correctAnswer: 1 },
  { id: 23, category: 'Sports', question: 'How many rings are on the Olympic flag?', options: ['4', '5', '6', '7'], correctAnswer: 1 },
  { id: 24, category: 'Sports', question: 'What is the diameter of a basketball hoop in inches?', options: ['16', '18', '20', '22'], correctAnswer: 1 },
  { id: 25, category: 'Sports', question: 'Which country has won the most FIFA World Cups?', options: ['Germany', 'Argentina', 'Italy', 'Brazil'], correctAnswer: 3 },
  { id: 26, category: 'Sports', question: 'In golf, what is one under par called?', options: ['Eagle', 'Birdie', 'Bogey', 'Albatross'], correctAnswer: 1 },
  { id: 27, category: 'Sports', question: 'How long is a marathon in miles?', options: ['24.2', '25.2', '26.2', '27.2'], correctAnswer: 2 },
  { id: 28, category: 'Sports', question: 'What sport is known as "The Sport of Kings"?', options: ['Polo', 'Horse Racing', 'Cricket', 'Golf'], correctAnswer: 1 },
  { id: 29, category: 'Sports', question: 'How many points is a touchdown worth in NFL?', options: ['5', '6', '7', '8'], correctAnswer: 1 },
  { id: 30, category: 'Sports', question: 'What is the national sport of Japan?', options: ['Karate', 'Judo', 'Sumo Wrestling', 'Kendo'], correctAnswer: 2 },

  // Geography (10 questions)
  { id: 31, category: 'Geography', question: 'What is the capital of Australia?', options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'], correctAnswer: 2 },
  { id: 32, category: 'Geography', question: 'Which is the largest ocean on Earth?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], correctAnswer: 3 },
  { id: 33, category: 'Geography', question: 'How many continents are there?', options: ['5', '6', '7', '8'], correctAnswer: 2 },
  { id: 34, category: 'Geography', question: 'What is the longest river in the world?', options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], correctAnswer: 1 },
  { id: 35, category: 'Geography', question: 'Which country has the most natural lakes?', options: ['USA', 'Russia', 'Canada', 'Brazil'], correctAnswer: 2 },
  { id: 36, category: 'Geography', question: 'Mount Everest is located in which mountain range?', options: ['Alps', 'Andes', 'Himalayas', 'Rockies'], correctAnswer: 2 },
  { id: 37, category: 'Geography', question: 'What is the smallest country in the world?', options: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'], correctAnswer: 1 },
  { id: 38, category: 'Geography', question: 'Which desert is the largest in the world?', options: ['Sahara', 'Arabian', 'Gobi', 'Antarctic'], correctAnswer: 3 },
  { id: 39, category: 'Geography', question: 'What is the capital of Canada?', options: ['Toronto', 'Vancouver', 'Ottawa', 'Montreal'], correctAnswer: 2 },
  { id: 40, category: 'Geography', question: 'Which country has the most islands?', options: ['Indonesia', 'Philippines', 'Sweden', 'Japan'], correctAnswer: 2 },

  // Entertainment (10 questions)
  { id: 41, category: 'Entertainment', question: 'Who directed "The Godfather"?', options: ['Martin Scorsese', 'Francis Ford Coppola', 'Steven Spielberg', 'Quentin Tarantino'], correctAnswer: 1 },
  { id: 42, category: 'Entertainment', question: 'Which movie won the most Oscars?', options: ['Titanic', 'Ben-Hur', 'The Lord of the Rings', 'All tied at 11'], correctAnswer: 3 },
  { id: 43, category: 'Entertainment', question: 'Who painted the Mona Lisa?', options: ['Michelangelo', 'Leonardo da Vinci', 'Raphael', 'Donatello'], correctAnswer: 1 },
  { id: 44, category: 'Entertainment', question: 'Which band released "Bohemian Rhapsody"?', options: ['The Beatles', 'Queen', 'Led Zeppelin', 'Pink Floyd'], correctAnswer: 1 },
  { id: 45, category: 'Entertainment', question: 'Who wrote "Romeo and Juliet"?', options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'], correctAnswer: 1 },
  { id: 46, category: 'Entertainment', question: 'What is the highest-grossing film of all time?', options: ['Titanic', 'Avatar', 'Avengers: Endgame', 'Star Wars'], correctAnswer: 1 },
  { id: 47, category: 'Entertainment', question: 'Who is the lead singer of U2?', options: ['Bono', 'Sting', 'Bruce Springsteen', 'Michael Stipe'], correctAnswer: 0 },
  { id: 48, category: 'Entertainment', question: 'Which TV show features a character named Walter White?', options: ['The Wire', 'Breaking Bad', 'The Sopranos', 'Mad Men'], correctAnswer: 1 },
  { id: 49, category: 'Entertainment', question: 'Who composed the Four Seasons?', options: ['Mozart', 'Beethoven', 'Vivaldi', 'Bach'], correctAnswer: 2 },
  { id: 50, category: 'Entertainment', question: 'Which novel begins with "Call me Ishmael"?', options: ['The Old Man and the Sea', 'Moby-Dick', '20,000 Leagues Under the Sea', 'Treasure Island'], correctAnswer: 1 },
];

export default function App() {
  const [screen, setScreen] = useState<'menu' | 'category' | 'game' | 'results'>('menu');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [stats, setStats] = useState<GameStats>({
    highScore: 0,
    totalPlayed: 0,
    totalCorrect: 0,
    categoryScores: {},
  });
  const [adCounter, setAdCounter] = useState(0);

  useEffect(() => {
    initializeAds();
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setStats(JSON.parse(saved));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveStats = async (newStats: GameStats) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
      setStats(newStats);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const startGame = (category: string) => {
    const categoryQuestions = QUESTIONS.filter(q => q.category === category);
    const shuffled = [...categoryQuestions].sort(() => Math.random() - 0.5);

    setSelectedCategory(category);
    setCurrentQuestions(shuffled);
    setCurrentQuestionIndex(0);
    setScore(0);
    setLives(3);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setScreen('game');
  };

  const handleAnswer = (answerIndex: number) => {
    if (showFeedback) return;

    const currentQuestion = currentQuestions[currentQuestionIndex];
    const isCorrect = answerIndex === currentQuestion.correctAnswer;

    setSelectedAnswer(answerIndex);
    setShowFeedback(true);

    if (isCorrect) {
      setScore(prev => prev + 1);
    } else {
      setLives(prev => prev - 1);
    }

    setTimeout(() => {
      if (!isCorrect && lives - 1 === 0) {
        endGame();
      } else if (currentQuestionIndex + 1 >= currentQuestions.length) {
        endGame();
      } else {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      }
    }, 1500);
  };

  const endGame = () => {
    const newStats = {
      ...stats,
      highScore: Math.max(stats.highScore, score),
      totalPlayed: stats.totalPlayed + 1,
      totalCorrect: stats.totalCorrect + score,
      categoryScores: {
        ...stats.categoryScores,
        [selectedCategory!]: Math.max(
          stats.categoryScores[selectedCategory!] || 0,
          score
        ),
      },
    };
    saveStats(newStats);

    const count = adCounter + 1;
    setAdCounter(count);
    if (count % 2 === 0) {
      setTimeout(() => showInterstitialAd(), 500);
    }

    setScreen('results');
  };

  const renderMenu = () => (
    <View style={styles.menuContainer}>
      <Text style={styles.logo}>🧠 Trivia Quiz</Text>
      <Text style={styles.subtitle}>Test Your Knowledge</Text>

      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Your Stats</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.highScore}</Text>
            <Text style={styles.statLabel}>High Score</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalPlayed}</Text>
            <Text style={styles.statLabel}>Games</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {stats.totalPlayed > 0
                ? Math.round((stats.totalCorrect / (stats.totalPlayed * 10)) * 100)
                : 0}%
            </Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.playBtn}
        onPress={() => setScreen('category')}
      >
        <Text style={styles.playBtnText}>Play Now</Text>
      </TouchableOpacity>

      <Text style={styles.info}>50+ Questions • 5 Categories • 3 Lives</Text>
    </View>
  );

  const renderCategorySelect = () => (
    <View style={styles.categoryContainer}>
      <Text style={styles.categoryTitle}>Choose a Category</Text>

      <ScrollView contentContainerStyle={styles.categoriesGrid}>
        {CATEGORIES.map((category, index) => (
          <TouchableOpacity
            key={category}
            style={[styles.categoryCard, { backgroundColor: getCategoryColor(index) }]}
            onPress={() => startGame(category)}
          >
            <Text style={styles.categoryIcon}>{getCategoryIcon(category)}</Text>
            <Text style={styles.categoryName}>{category}</Text>
            <Text style={styles.categoryBest}>
              Best: {stats.categoryScores[category] || 0}/10
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => setScreen('menu')}
      >
        <Text style={styles.backBtnText}>Back to Menu</Text>
      </TouchableOpacity>
    </View>
  );

  const renderGame = () => {
    if (currentQuestions.length === 0) return null;

    const currentQuestion = currentQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / currentQuestions.length) * 100;

    return (
      <View style={styles.gameContainer}>
        <View style={styles.gameHeader}>
          <View style={styles.livesContainer}>
            {[...Array(3)].map((_, i) => (
              <Text key={i} style={styles.heart}>
                {i < lives ? '❤️' : '🤍'}
              </Text>
            ))}
          </View>
          <Text style={styles.scoreText}>Score: {score}</Text>
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        <Text style={styles.questionNumber}>
          Question {currentQuestionIndex + 1} of {currentQuestions.length}
        </Text>

        <View style={styles.questionCard}>
          <Text style={styles.categoryBadge}>{currentQuestion.category}</Text>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </View>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => {
            let buttonStyle = styles.optionBtn;
            if (showFeedback) {
              if (index === currentQuestion.correctAnswer) {
                buttonStyle = styles.optionBtnCorrect;
              } else if (index === selectedAnswer) {
                buttonStyle = styles.optionBtnWrong;
              }
            }

            return (
              <TouchableOpacity
                key={index}
                style={[styles.optionBtn, buttonStyle]}
                onPress={() => handleAnswer(index)}
                disabled={showFeedback}
              >
                <View style={styles.optionContent}>
                  <Text style={styles.optionLetter}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                  <Text style={styles.optionText}>{option}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderResults = () => (
    <View style={styles.resultsContainer}>
      <Text style={styles.resultsTitle}>
        {lives > 0 ? '🎉 Quiz Complete!' : '💔 Game Over'}
      </Text>

      <View style={styles.resultsCard}>
        <Text style={styles.finalScore}>{score}</Text>
        <Text style={styles.finalScoreLabel}>Final Score</Text>

        {score === stats.highScore && score > 0 && (
          <Text style={styles.newRecord}>New High Score!</Text>
        )}

        <View style={styles.resultStats}>
          <View style={styles.resultStatItem}>
            <Text style={styles.resultStatValue}>{score}/{currentQuestions.length}</Text>
            <Text style={styles.resultStatLabel}>Correct</Text>
          </View>
          <View style={styles.resultStatItem}>
            <Text style={styles.resultStatValue}>
              {Math.round((score / currentQuestions.length) * 100)}%
            </Text>
            <Text style={styles.resultStatLabel}>Accuracy</Text>
          </View>
          <View style={styles.resultStatItem}>
            <Text style={styles.resultStatValue}>{lives}</Text>
            <Text style={styles.resultStatLabel}>Lives Left</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.playAgainBtn}
        onPress={() => setScreen('category')}
      >
        <Text style={styles.playAgainBtnText}>Play Again</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuBtn}
        onPress={() => setScreen('menu')}
      >
        <Text style={styles.menuBtnText}>Main Menu</Text>
      </TouchableOpacity>
    </View>
  );

  const getCategoryColor = (index: number): string => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
    return colors[index % colors.length];
  };

  const getCategoryIcon = (category: string): string => {
    const icons: { [key: string]: string } = {
      'History': '📚',
      'Science': '🔬',
      'Sports': '⚽',
      'Geography': '🌍',
      'Entertainment': '🎬',
    };
    return icons[category] || '📝';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView contentContainerStyle={styles.content}>
        {screen === 'menu' && renderMenu()}
        {screen === 'category' && renderCategorySelect()}
        {screen === 'game' && renderGame()}
        {screen === 'results' && renderResults()}
      </ScrollView>

      <AdBanner />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  // Menu styles
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 18,
    color: colors.gray.dark,
    marginBottom: spacing.xl,
  },
  statsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xl,
    width: '100%',
    marginBottom: spacing.xl,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray.dark,
    marginTop: 4,
  },
  playBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl * 2,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  playBtnText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  info: {
    fontSize: 14,
    color: colors.gray.dark,
    textAlign: 'center',
  },
  // Category selection styles
  categoryContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  categoriesGrid: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  categoryCard: {
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  categoryIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  categoryName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.sm,
  },
  categoryBest: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  backBtn: {
    backgroundColor: colors.gray.light,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  backBtnText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  // Game styles
  gameContainer: {
    flex: 1,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  livesContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  heart: {
    fontSize: 24,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.gray.light,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  questionNumber: {
    fontSize: 14,
    color: colors.gray.dark,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  questionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  categoryBadge: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  questionText: {
    fontSize: 18,
    color: colors.text,
    lineHeight: 26,
  },
  optionsContainer: {
    gap: spacing.md,
  },
  optionBtn: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.gray.light,
  },
  optionBtnCorrect: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  optionBtnWrong: {
    backgroundColor: '#f44336',
    borderColor: '#f44336',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLetter: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginRight: spacing.md,
    width: 24,
  },
  optionText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  // Results styles
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  resultsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xl,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  finalScore: {
    fontSize: 64,
    fontWeight: 'bold',
    color: colors.primary,
  },
  finalScoreLabel: {
    fontSize: 18,
    color: colors.gray.dark,
    marginBottom: spacing.lg,
  },
  newRecord: {
    fontSize: 16,
    color: colors.status.success,
    fontWeight: 'bold',
    marginBottom: spacing.lg,
  },
  resultStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: colors.gray.light,
    paddingTop: spacing.lg,
  },
  resultStatItem: {
    alignItems: 'center',
  },
  resultStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  resultStatLabel: {
    fontSize: 12,
    color: colors.gray.dark,
    marginTop: 4,
  },
  playAgainBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl * 2,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    width: '100%',
    alignItems: 'center',
  },
  playAgainBtnText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuBtn: {
    backgroundColor: colors.gray.light,
    paddingVertical: spacing.md,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  menuBtnText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
