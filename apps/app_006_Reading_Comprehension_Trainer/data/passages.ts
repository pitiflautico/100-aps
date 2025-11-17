export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
  explanation: string;
}

export interface Passage {
  id: string;
  title: string;
  category: 'science' | 'history' | 'literature' | 'nature' | 'technology';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  content: string;
  questions: Question[];
}

export const PASSAGES: Passage[] = [
  {
    id: '1',
    title: 'The Solar System',
    category: 'science',
    difficulty: 'beginner',
    content: `The Solar System is the gravitationally bound system of the Sun and the objects that orbit it. The Sun is at the center of our Solar System and contains 99.86% of the system's mass. Eight planets orbit the Sun: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune.

The four inner planets (Mercury, Venus, Earth, and Mars) are called terrestrial planets because they have rocky surfaces. The four outer planets (Jupiter, Saturn, Uranus, and Neptune) are called gas giants because they are much larger and made primarily of gases.

Earth is the third planet from the Sun and the only known planet to support life. It has one natural satellite, the Moon, which orbits Earth and affects ocean tides through gravitational pull.`,
    questions: [
      {
        id: 'q1',
        question: 'What percentage of the Solar System\'s mass does the Sun contain?',
        options: ['50%', '75%', '99.86%', '100%'],
        correctAnswer: 2,
        explanation: 'The Sun contains 99.86% of the Solar System\'s mass, making it by far the largest object in our solar system.'
      },
      {
        id: 'q2',
        question: 'How many planets orbit the Sun?',
        options: ['Seven', 'Eight', 'Nine', 'Ten'],
        correctAnswer: 1,
        explanation: 'Eight planets orbit the Sun: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune.'
      },
      {
        id: 'q3',
        question: 'What are the inner planets called?',
        options: ['Gas giants', 'Terrestrial planets', 'Ice planets', 'Dwarf planets'],
        correctAnswer: 1,
        explanation: 'The inner planets are called terrestrial planets because they have rocky surfaces.'
      },
      {
        id: 'q4',
        question: 'Which planet is third from the Sun?',
        options: ['Mars', 'Venus', 'Earth', 'Mercury'],
        correctAnswer: 2,
        explanation: 'Earth is the third planet from the Sun and the only known planet to support life.'
      }
    ]
  },
  {
    id: '2',
    title: 'Photosynthesis',
    category: 'science',
    difficulty: 'intermediate',
    content: `Photosynthesis is the process by which plants, algae, and some bacteria convert light energy into chemical energy stored in glucose. This process occurs primarily in the chloroplasts of plant cells, which contain the green pigment chlorophyll.

The overall equation for photosynthesis is: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂. This means plants take in carbon dioxide and water, and with the help of sunlight, produce glucose and oxygen.

Photosynthesis consists of two main stages: the light-dependent reactions and the light-independent reactions (Calvin cycle). Light-dependent reactions occur in the thylakoid membranes and produce ATP and NADPH. The Calvin cycle occurs in the stroma and uses these products to convert CO₂ into glucose.

This process is crucial for life on Earth as it produces oxygen and serves as the foundation of most food chains.`,
    questions: [
      {
        id: 'q1',
        question: 'Where does photosynthesis primarily occur in plant cells?',
        options: ['Nucleus', 'Mitochondria', 'Chloroplasts', 'Ribosomes'],
        correctAnswer: 2,
        explanation: 'Photosynthesis occurs primarily in the chloroplasts, which contain chlorophyll.'
      },
      {
        id: 'q2',
        question: 'What gas do plants release during photosynthesis?',
        options: ['Carbon dioxide', 'Nitrogen', 'Oxygen', 'Hydrogen'],
        correctAnswer: 2,
        explanation: 'Plants release oxygen (O₂) as a byproduct of photosynthesis.'
      },
      {
        id: 'q3',
        question: 'What are the two main stages of photosynthesis?',
        options: ['Respiration and transpiration', 'Light-dependent and light-independent reactions', 'Growth and reproduction', 'Absorption and release'],
        correctAnswer: 1,
        explanation: 'The two main stages are light-dependent reactions and light-independent reactions (Calvin cycle).'
      }
    ]
  },
  {
    id: '3',
    title: 'The Roman Empire',
    category: 'history',
    difficulty: 'intermediate',
    content: `The Roman Empire was one of the largest and most influential civilizations in world history. It began in 27 BCE when Augustus became the first Roman Emperor, transforming the Roman Republic into an empire. At its peak around 117 CE, the empire controlled approximately 5 million square kilometers, spanning from Britain to Egypt and from Spain to Mesopotamia.

Roman innovations had lasting impacts on Western civilization. They developed an extensive road network, aqueducts for water supply, and concrete construction. The Roman legal system formed the basis for many modern legal frameworks. Latin, the language of the Romans, evolved into the Romance languages including Spanish, French, Italian, Portuguese, and Romanian.

The empire's decline began in the 3rd century CE due to various factors including economic troubles, military defeats, and political instability. The Western Roman Empire officially fell in 476 CE when the last emperor was deposed, while the Eastern Roman Empire (Byzantine Empire) continued until 1453 CE.`,
    questions: [
      {
        id: 'q1',
        question: 'Who was the first Roman Emperor?',
        options: ['Julius Caesar', 'Augustus', 'Nero', 'Constantine'],
        correctAnswer: 1,
        explanation: 'Augustus became the first Roman Emperor in 27 BCE, transforming the republic into an empire.'
      },
      {
        id: 'q2',
        question: 'When did the Western Roman Empire fall?',
        options: ['27 BCE', '117 CE', '476 CE', '1453 CE'],
        correctAnswer: 2,
        explanation: 'The Western Roman Empire officially fell in 476 CE when the last emperor was deposed.'
      },
      {
        id: 'q3',
        question: 'Which of these is NOT a Romance language descended from Latin?',
        options: ['French', 'Spanish', 'German', 'Italian'],
        correctAnswer: 2,
        explanation: 'German is not a Romance language. French, Spanish, and Italian all evolved from Latin.'
      }
    ]
  },
  {
    id: '4',
    title: 'The Water Cycle',
    category: 'nature',
    difficulty: 'beginner',
    content: `The water cycle, also known as the hydrologic cycle, describes the continuous movement of water on, above, and below the surface of the Earth. This cycle is essential for life and involves several key processes.

Evaporation occurs when the sun heats water in oceans, lakes, and rivers, turning it into water vapor that rises into the atmosphere. Transpiration is a similar process where plants release water vapor through their leaves.

As water vapor rises and cools, it condenses into tiny droplets that form clouds. This process is called condensation. When these droplets become heavy enough, they fall back to Earth as precipitation in the form of rain, snow, sleet, or hail.

Water that falls to Earth either flows over the land as runoff into rivers and oceans, or soaks into the ground becoming groundwater. The cycle then continues as water evaporates again, making it a continuous process that has been occurring for billions of years.`,
    questions: [
      {
        id: 'q1',
        question: 'What causes water to evaporate?',
        options: ['Wind', 'The Sun\'s heat', 'Gravity', 'Plant growth'],
        correctAnswer: 1,
        explanation: 'The Sun\'s heat causes water to evaporate, turning it into water vapor.'
      },
      {
        id: 'q2',
        question: 'What is the process called when water vapor forms clouds?',
        options: ['Evaporation', 'Precipitation', 'Condensation', 'Transpiration'],
        correctAnswer: 2,
        explanation: 'Condensation is the process where water vapor cools and forms clouds.'
      },
      {
        id: 'q3',
        question: 'What is transpiration?',
        options: ['Water flowing in rivers', 'Plants releasing water vapor', 'Rain falling', 'Ice melting'],
        correctAnswer: 1,
        explanation: 'Transpiration is the process where plants release water vapor through their leaves.'
      }
    ]
  },
  {
    id: '5',
    title: 'Artificial Intelligence',
    category: 'technology',
    difficulty: 'advanced',
    content: `Artificial Intelligence (AI) refers to the simulation of human intelligence in machines programmed to think and learn like humans. The field of AI research was founded in 1956, but recent advances in computing power, big data, and algorithm development have accelerated its progress dramatically.

There are two main types of AI: narrow AI and general AI. Narrow AI, also called weak AI, is designed to perform specific tasks such as voice recognition, image classification, or playing chess. This is the type of AI we commonly interact with today. General AI, or strong AI, refers to machines that possess the ability to understand, learn, and apply knowledge across a wide range of tasks at a human level—this remains theoretical.

Machine learning is a subset of AI that enables systems to learn and improve from experience without being explicitly programmed. Deep learning, a subset of machine learning, uses neural networks with multiple layers to analyze data patterns. These technologies power many modern applications including virtual assistants, recommendation systems, autonomous vehicles, and medical diagnosis tools.

Ethical considerations around AI include privacy concerns, job displacement, algorithmic bias, and the need for transparent decision-making processes in AI systems.`,
    questions: [
      {
        id: 'q1',
        question: 'When was the field of AI research founded?',
        options: ['1936', '1956', '1976', '1996'],
        correctAnswer: 1,
        explanation: 'The field of AI research was founded in 1956.'
      },
      {
        id: 'q2',
        question: 'What is narrow AI?',
        options: ['AI that performs specific tasks', 'AI with human-level intelligence', 'AI that controls robots', 'AI used in medicine only'],
        correctAnswer: 0,
        explanation: 'Narrow AI is designed to perform specific tasks like voice recognition or image classification.'
      },
      {
        id: 'q3',
        question: 'What does machine learning enable?',
        options: ['Computers to be smaller', 'Systems to learn from experience', 'Faster internet speeds', 'Better graphics'],
        correctAnswer: 1,
        explanation: 'Machine learning enables systems to learn and improve from experience without explicit programming.'
      },
      {
        id: 'q4',
        question: 'What uses neural networks with multiple layers?',
        options: ['Narrow AI', 'General AI', 'Deep learning', 'Quantum computing'],
        correctAnswer: 2,
        explanation: 'Deep learning uses neural networks with multiple layers to analyze data patterns.'
      }
    ]
  },
  {
    id: '6',
    title: 'Shakespeare and the Globe Theatre',
    category: 'literature',
    difficulty: 'intermediate',
    content: `William Shakespeare (1564-1616) is widely regarded as the greatest writer in the English language and the world's pre-eminent dramatist. He wrote approximately 39 plays, 154 sonnets, and several longer poems during his career. His works have been translated into every major language and are performed more often than those of any other playwright.

The Globe Theatre, built in 1599, was the primary venue for Shakespeare's plays. It was a three-story, open-air amphitheater that could hold up to 3,000 spectators. The theater had a rectangular stage that extended into the audience, allowing actors to be surrounded on three sides. There was no artificial lighting, so performances occurred during daylight hours.

Shakespeare's plays are typically categorized into three genres: comedies (like "A Midsummer Night's Dream"), tragedies (like "Hamlet" and "Macbeth"), and histories (like "Henry V"). His works explored universal themes of love, power, jealousy, betrayal, and the supernatural.

The original Globe Theatre was destroyed by fire in 1613 during a performance of "Henry VIII." A modern reconstruction, called "Shakespeare's Globe," was opened in 1997 near the original site in London.`,
    questions: [
      {
        id: 'q1',
        question: 'How many plays did Shakespeare write?',
        options: ['Approximately 25', 'Approximately 39', 'Approximately 50', 'Exactly 100'],
        correctAnswer: 1,
        explanation: 'Shakespeare wrote approximately 39 plays during his career.'
      },
      {
        id: 'q2',
        question: 'When was the Globe Theatre built?',
        options: ['1564', '1599', '1613', '1997'],
        correctAnswer: 1,
        explanation: 'The Globe Theatre was built in 1599 and was the primary venue for Shakespeare\'s plays.'
      },
      {
        id: 'q3',
        question: 'What destroyed the original Globe Theatre?',
        options: ['Flood', 'Fire', 'Earthquake', 'War'],
        correctAnswer: 1,
        explanation: 'The original Globe Theatre was destroyed by fire in 1613 during a performance.'
      }
    ]
  },
  {
    id: '7',
    title: 'Climate Change',
    category: 'science',
    difficulty: 'advanced',
    content: `Climate change refers to long-term shifts in global temperatures and weather patterns. While climate change is a natural phenomenon that has occurred throughout Earth's history, scientific evidence shows that current warming trends are largely human-induced, primarily through the emission of greenhouse gases.

The main greenhouse gases include carbon dioxide (CO₂), methane (CH₄), and nitrous oxide (N₂O). These gases trap heat in Earth's atmosphere, creating what's known as the greenhouse effect. Since the Industrial Revolution, CO₂ concentrations have increased by over 40%, primarily from burning fossil fuels for energy and transportation.

The effects of climate change are already observable: global average temperatures have risen approximately 1.1°C since pre-industrial times, Arctic sea ice is declining, sea levels are rising, and extreme weather events are becoming more frequent. Scientists project that without significant reduction in emissions, global temperatures could rise 3-4°C by 2100.

Addressing climate change requires both mitigation (reducing greenhouse gas emissions) and adaptation (adjusting to current and future impacts). Solutions include transitioning to renewable energy, improving energy efficiency, protecting forests, and developing sustainable agricultural practices.`,
    questions: [
      {
        id: 'q1',
        question: 'What is the primary cause of current climate change?',
        options: ['Solar activity', 'Volcanic eruptions', 'Human emission of greenhouse gases', 'Ocean currents'],
        correctAnswer: 2,
        explanation: 'Current warming trends are largely human-induced, primarily through emission of greenhouse gases.'
      },
      {
        id: 'q2',
        question: 'By how much have CO₂ concentrations increased since the Industrial Revolution?',
        options: ['10%', '25%', 'Over 40%', '100%'],
        correctAnswer: 2,
        explanation: 'CO₂ concentrations have increased by over 40% since the Industrial Revolution.'
      },
      {
        id: 'q3',
        question: 'How much have global temperatures risen since pre-industrial times?',
        options: ['0.5°C', '1.1°C', '2.5°C', '5°C'],
        correctAnswer: 1,
        explanation: 'Global average temperatures have risen approximately 1.1°C since pre-industrial times.'
      }
    ]
  },
  {
    id: '8',
    title: 'The Amazon Rainforest',
    category: 'nature',
    difficulty: 'intermediate',
    content: `The Amazon Rainforest, often called the "lungs of the Earth," is the world's largest tropical rainforest, covering approximately 5.5 million square kilometers across nine South American countries. Brazil contains about 60% of the forest, followed by Peru and Colombia.

The Amazon is home to an estimated 10% of all species on Earth. Scientists have identified over 40,000 plant species, 3,000 fish species, 1,300 bird species, and 430 mammal species in the region. Many species remain undiscovered, with scientists estimating that new species are identified every few days.

The rainforest plays a crucial role in regulating global climate by absorbing massive amounts of carbon dioxide and releasing oxygen. The Amazon produces about 20% of the world's oxygen and stores an estimated 150-200 billion tons of carbon. It also influences rainfall patterns across South America and beyond.

However, the Amazon faces severe threats from deforestation, primarily driven by cattle ranching, agriculture, logging, and mining. Scientists estimate that about 17% of the original forest has been lost in the past 50 years. This deforestation contributes to climate change and threatens countless species with extinction.`,
    questions: [
      {
        id: 'q1',
        question: 'What percentage of Earth\'s species live in the Amazon?',
        options: ['1%', '5%', '10%', '25%'],
        correctAnswer: 2,
        explanation: 'The Amazon is home to an estimated 10% of all species on Earth.'
      },
      {
        id: 'q2',
        question: 'What percentage of the world\'s oxygen does the Amazon produce?',
        options: ['5%', '10%', '20%', '50%'],
        correctAnswer: 2,
        explanation: 'The Amazon produces about 20% of the world\'s oxygen.'
      },
      {
        id: 'q3',
        question: 'What is the primary driver of Amazon deforestation?',
        options: ['Natural disasters', 'Climate change', 'Tourism', 'Cattle ranching and agriculture'],
        correctAnswer: 3,
        explanation: 'Deforestation is primarily driven by cattle ranching, agriculture, logging, and mining.'
      }
    ]
  }
];

export const getPassagesByCategory = (category: string): Passage[] => {
  return PASSAGES.filter(p => p.category === category);
};

export const getPassagesByDifficulty = (difficulty: string): Passage[] => {
  return PASSAGES.filter(p => p.difficulty === difficulty);
};

export const getPassageById = (id: string): Passage | undefined => {
  return PASSAGES.find(p => p.id === id);
};
