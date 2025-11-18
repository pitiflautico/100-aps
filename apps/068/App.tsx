import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Provider as PaperProvider,
  Appbar,
  FAB,
  Card,
  Text,
  Portal,
  Modal,
  TextInput,
  Button,
  Chip,
  Searchbar,
  IconButton,
  Menu,
  Divider,
  SegmentedButtons,
  Avatar,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
  InterstitialAd,
  AdEventType,
} from 'react-native-google-mobile-ads';

// TypeScript Interfaces
interface Pet {
  id: string;
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'fish' | 'rabbit' | 'hamster' | 'reptile' | 'other';
  breed: string;
  birthDate: string;
  gender: 'male' | 'female';
  weight: number;
  color: string;
  microchipId: string;
  vetName: string;
  vetPhone: string;
  notes: string;
  vaccinations: Vaccination[];
  medications: Medication[];
  appointments: Appointment[];
  activities: Activity[];
  createdAt: number;
}

interface Vaccination {
  id: string;
  name: string;
  date: string;
  nextDue: string;
  veterinarian: string;
  notes: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string;
  notes: string;
}

interface Appointment {
  id: string;
  type: string;
  date: string;
  time: string;
  veterinarian: string;
  reason: string;
  notes: string;
}

interface Activity {
  id: string;
  type: 'feeding' | 'walking' | 'grooming' | 'playing' | 'training' | 'other';
  date: string;
  duration: number;
  notes: string;
}

// AdMob Configuration
const bannerId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyy';
const interstitialId = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyy';

const interstitial = InterstitialAd.createForAdRequest(interstitialId);

const STORAGE_KEY = '@pet_care_tracker_pets';

const SPECIES = [
  { label: 'Dog', value: 'dog', icon: 'dog', color: '#8D6E63' },
  { label: 'Cat', value: 'cat', icon: 'cat', color: '#FF9800' },
  { label: 'Bird', value: 'bird', icon: 'bird', color: '#2196F3' },
  { label: 'Fish', value: 'fish', icon: 'fish', color: '#00BCD4' },
  { label: 'Rabbit', value: 'rabbit', icon: 'rabbit', color: '#9E9E9E' },
  { label: 'Hamster', value: 'hamster', icon: 'rodent', color: '#FFEB3B' },
  { label: 'Reptile', value: 'reptile', icon: 'snake', color: '#4CAF50' },
  { label: 'Other', value: 'other', icon: 'paw', color: '#607D8B' },
];

const ACTIVITY_TYPES = [
  { label: 'Feeding', value: 'feeding', icon: 'food-drumstick' },
  { label: 'Walking', value: 'walking', icon: 'walk' },
  { label: 'Grooming', value: 'grooming', icon: 'content-cut' },
  { label: 'Playing', value: 'playing', icon: 'tennis-ball' },
  { label: 'Training', value: 'training', icon: 'school' },
  { label: 'Other', value: 'other', icon: 'dots-horizontal' },
];

export default function App() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [petModalVisible, setPetModalVisible] = useState(false);
  const [vaccinationModalVisible, setVaccinationModalVisible] = useState(false);
  const [medicationModalVisible, setMedicationModalVisible] = useState(false);
  const [appointmentModalVisible, setAppointmentModalVisible] = useState(false);
  const [activityModalVisible, setActivityModalVisible] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState<'overview' | 'vaccinations' | 'medications' | 'activities'>('overview');
  const [menuVisible, setMenuVisible] = useState(false);
  const [interstitialLoaded, setInterstitialLoaded] = useState(false);

  // Form states
  const [petForm, setPetForm] = useState({
    name: '',
    species: 'dog' as Pet['species'],
    breed: '',
    birthDate: '',
    gender: 'male' as Pet['gender'],
    weight: '',
    color: '',
    microchipId: '',
    vetName: '',
    vetPhone: '',
    notes: '',
  });

  const [vaccinationForm, setVaccinationForm] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    nextDue: '',
    veterinarian: '',
    notes: '',
  });

  const [medicationForm, setMedicationForm] = useState({
    name: '',
    dosage: '',
    frequency: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    notes: '',
  });

  const [appointmentForm, setAppointmentForm] = useState({
    type: 'Checkup',
    date: '',
    time: '',
    veterinarian: '',
    reason: '',
    notes: '',
  });

  const [activityForm, setActivityForm] = useState({
    type: 'feeding' as Activity['type'],
    duration: '30',
    notes: '',
  });

  // AdMob Interstitial Setup
  useEffect(() => {
    const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      setInterstitialLoaded(true);
    });

    const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      setInterstitialLoaded(false);
      interstitial.load();
    });

    interstitial.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
    };
  }, []);

  // Load pets from storage
  useEffect(() => {
    loadPets();
  }, []);

  // Set first pet as selected
  useEffect(() => {
    if (pets.length > 0 && !selectedPet) {
      setSelectedPet(pets[0]);
    }
  }, [pets]);

  const loadPets = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPets(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading pets:', error);
    }
  };

  const savePets = async (newPets: Pet[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPets));
      setPets(newPets);
    } catch (error) {
      console.error('Error saving pets:', error);
    }
  };

  const openPetModal = (pet?: Pet) => {
    if (pet) {
      setEditingPet(pet);
      setPetForm({
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        birthDate: pet.birthDate,
        gender: pet.gender,
        weight: pet.weight.toString(),
        color: pet.color,
        microchipId: pet.microchipId,
        vetName: pet.vetName,
        vetPhone: pet.vetPhone,
        notes: pet.notes,
      });
    } else {
      setEditingPet(null);
      setPetForm({
        name: '',
        species: 'dog',
        breed: '',
        birthDate: '',
        gender: 'male',
        weight: '',
        color: '',
        microchipId: '',
        vetName: '',
        vetPhone: '',
        notes: '',
      });
    }
    setPetModalVisible(true);
  };

  const savePet = async () => {
    if (!petForm.name.trim()) {
      Alert.alert('Error', 'Please enter pet name');
      return;
    }

    const pet: Pet = {
      id: editingPet?.id || Date.now().toString(),
      name: petForm.name.trim(),
      species: petForm.species,
      breed: petForm.breed.trim(),
      birthDate: petForm.birthDate,
      gender: petForm.gender,
      weight: parseFloat(petForm.weight) || 0,
      color: petForm.color.trim(),
      microchipId: petForm.microchipId.trim(),
      vetName: petForm.vetName.trim(),
      vetPhone: petForm.vetPhone.trim(),
      notes: petForm.notes.trim(),
      vaccinations: editingPet?.vaccinations || [],
      medications: editingPet?.medications || [],
      appointments: editingPet?.appointments || [],
      activities: editingPet?.activities || [],
      createdAt: editingPet?.createdAt || Date.now(),
    };

    let newPets: Pet[];
    if (editingPet) {
      newPets = pets.map(p => (p.id === editingPet.id ? pet : p));
      if (selectedPet?.id === editingPet.id) {
        setSelectedPet(pet);
      }
    } else {
      newPets = [...pets, pet];
      setSelectedPet(pet);

      if (newPets.length % 3 === 0 && interstitialLoaded) {
        interstitial.show();
      }
    }

    await savePets(newPets);
    setPetModalVisible(false);
  };

  const deletePet = (id: string) => {
    Alert.alert('Delete Pet', 'Are you sure you want to delete this pet and all its records?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const newPets = pets.filter(pet => pet.id !== id);
          await savePets(newPets);
          if (selectedPet?.id === id) {
            setSelectedPet(newPets[0] || null);
          }
        },
      },
    ]);
  };

  const addVaccination = async () => {
    if (!selectedPet || !vaccinationForm.name.trim()) {
      Alert.alert('Error', 'Please enter vaccination name');
      return;
    }

    const vaccination: Vaccination = {
      id: Date.now().toString(),
      name: vaccinationForm.name.trim(),
      date: vaccinationForm.date,
      nextDue: vaccinationForm.nextDue,
      veterinarian: vaccinationForm.veterinarian.trim(),
      notes: vaccinationForm.notes.trim(),
    };

    const updatedPet = {
      ...selectedPet,
      vaccinations: [...selectedPet.vaccinations, vaccination],
    };

    const newPets = pets.map(p => (p.id === selectedPet.id ? updatedPet : p));
    await savePets(newPets);
    setSelectedPet(updatedPet);
    setVaccinationModalVisible(false);

    setVaccinationForm({
      name: '',
      date: new Date().toISOString().split('T')[0],
      nextDue: '',
      veterinarian: '',
      notes: '',
    });
  };

  const deleteVaccination = async (vaccinationId: string) => {
    if (!selectedPet) return;

    const updatedPet = {
      ...selectedPet,
      vaccinations: selectedPet.vaccinations.filter(v => v.id !== vaccinationId),
    };

    const newPets = pets.map(p => (p.id === selectedPet.id ? updatedPet : p));
    await savePets(newPets);
    setSelectedPet(updatedPet);
  };

  const addMedication = async () => {
    if (!selectedPet || !medicationForm.name.trim()) {
      Alert.alert('Error', 'Please enter medication name');
      return;
    }

    const medication: Medication = {
      id: Date.now().toString(),
      name: medicationForm.name.trim(),
      dosage: medicationForm.dosage.trim(),
      frequency: medicationForm.frequency.trim(),
      startDate: medicationForm.startDate,
      endDate: medicationForm.endDate,
      notes: medicationForm.notes.trim(),
    };

    const updatedPet = {
      ...selectedPet,
      medications: [...selectedPet.medications, medication],
    };

    const newPets = pets.map(p => (p.id === selectedPet.id ? updatedPet : p));
    await savePets(newPets);
    setSelectedPet(updatedPet);
    setMedicationModalVisible(false);

    setMedicationForm({
      name: '',
      dosage: '',
      frequency: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      notes: '',
    });
  };

  const deleteMedication = async (medicationId: string) => {
    if (!selectedPet) return;

    const updatedPet = {
      ...selectedPet,
      medications: selectedPet.medications.filter(m => m.id !== medicationId),
    };

    const newPets = pets.map(p => (p.id === selectedPet.id ? updatedPet : p));
    await savePets(newPets);
    setSelectedPet(updatedPet);
  };

  const addActivity = async () => {
    if (!selectedPet) return;

    const activity: Activity = {
      id: Date.now().toString(),
      type: activityForm.type,
      date: new Date().toISOString().split('T')[0],
      duration: parseInt(activityForm.duration) || 0,
      notes: activityForm.notes.trim(),
    };

    const updatedPet = {
      ...selectedPet,
      activities: [...selectedPet.activities, activity],
    };

    const newPets = pets.map(p => (p.id === selectedPet.id ? updatedPet : p));
    await savePets(newPets);
    setSelectedPet(updatedPet);
    setActivityModalVisible(false);

    setActivityForm({
      type: 'feeding',
      duration: '30',
      notes: '',
    });
  };

  const deleteActivity = async (activityId: string) => {
    if (!selectedPet) return;

    const updatedPet = {
      ...selectedPet,
      activities: selectedPet.activities.filter(a => a.id !== activityId),
    };

    const newPets = pets.map(p => (p.id === selectedPet.id ? updatedPet : p));
    await savePets(newPets);
    setSelectedPet(updatedPet);
  };

  const getAge = (birthDate: string) => {
    if (!birthDate) return 'Unknown';
    const today = new Date();
    const birth = new Date(birthDate);
    const years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();

    if (years === 0) {
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else if (months < 0) {
      return `${years - 1} year${years - 1 !== 1 ? 's' : ''}`;
    } else {
      return `${years} year${years !== 1 ? 's' : ''}${months > 0 ? `, ${months} month${months !== 1 ? 's' : ''}` : ''}`;
    }
  };

  const getSpeciesInfo = (species: string) => {
    return SPECIES.find(s => s.value === species) || SPECIES[SPECIES.length - 1];
  };

  const getActivityIcon = (type: string) => {
    return ACTIVITY_TYPES.find(a => a.value === type)?.icon || 'dots-horizontal';
  };

  return (
    <PaperProvider>
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.Content title="Pet Care Tracker" />
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Appbar.Action
                icon="dots-vertical"
                onPress={() => setMenuVisible(true)}
              />
            }
          >
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                openPetModal();
              }}
              title="Add New Pet"
              leadingIcon="plus"
            />
          </Menu>
        </Appbar.Header>

        {pets.length === 0 ? (
          <View style={styles.emptyState}>
            <IconButton icon="paw" size={64} iconColor="#ccc" />
            <Text variant="titleMedium" style={styles.emptyText}>
              No pets added yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Add your first pet to start tracking their care
            </Text>
            <Button
              mode="contained"
              onPress={() => openPetModal()}
              style={styles.addFirstButton}
            >
              Add Pet
            </Button>
          </View>
        ) : (
          <>
            {/* Pet Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.petSelector}>
              {pets.map(pet => {
                const speciesInfo = getSpeciesInfo(pet.species);
                return (
                  <Card
                    key={pet.id}
                    style={[
                      styles.petCard,
                      selectedPet?.id === pet.id && styles.petCardSelected,
                    ]}
                    onPress={() => setSelectedPet(pet)}
                  >
                    <Card.Content style={styles.petCardContent}>
                      <Avatar.Icon
                        size={48}
                        icon={speciesInfo.icon}
                        style={{ backgroundColor: speciesInfo.color }}
                      />
                      <Text variant="titleSmall" style={styles.petCardName}>
                        {pet.name}
                      </Text>
                      <Text variant="bodySmall" style={styles.petCardBreed}>
                        {pet.breed || speciesInfo.label}
                      </Text>
                    </Card.Content>
                  </Card>
                );
              })}
            </ScrollView>

            {selectedPet && (
              <>
                {/* View Tabs */}
                <SegmentedButtons
                  value={currentView}
                  onValueChange={value => setCurrentView(value as any)}
                  buttons={[
                    { value: 'overview', label: 'Overview', icon: 'information' },
                    { value: 'vaccinations', label: 'Vaccines', icon: 'needle' },
                    { value: 'medications', label: 'Meds', icon: 'pill' },
                    { value: 'activities', label: 'Activities', icon: 'run' },
                  ]}
                  style={styles.segmentedButtons}
                />

                <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                  {currentView === 'overview' && (
                    <>
                      {/* Pet Info Card */}
                      <Card style={styles.infoCard}>
                        <Card.Content>
                          <View style={styles.infoHeader}>
                            <Text variant="titleLarge" style={styles.petName}>
                              {selectedPet.name}
                            </Text>
                            <View style={styles.infoActions}>
                              <IconButton
                                icon="pencil"
                                size={20}
                                onPress={() => openPetModal(selectedPet)}
                              />
                              <IconButton
                                icon="delete"
                                size={20}
                                iconColor="#d32f2f"
                                onPress={() => deletePet(selectedPet.id)}
                              />
                            </View>
                          </View>

                          <Divider style={styles.divider} />

                          <View style={styles.infoRow}>
                            <Text variant="bodyMedium" style={styles.infoLabel}>
                              Species:
                            </Text>
                            <Text variant="bodyMedium">{getSpeciesInfo(selectedPet.species).label}</Text>
                          </View>

                          {selectedPet.breed && (
                            <View style={styles.infoRow}>
                              <Text variant="bodyMedium" style={styles.infoLabel}>
                                Breed:
                              </Text>
                              <Text variant="bodyMedium">{selectedPet.breed}</Text>
                            </View>
                          )}

                          <View style={styles.infoRow}>
                            <Text variant="bodyMedium" style={styles.infoLabel}>
                              Age:
                            </Text>
                            <Text variant="bodyMedium">{getAge(selectedPet.birthDate)}</Text>
                          </View>

                          <View style={styles.infoRow}>
                            <Text variant="bodyMedium" style={styles.infoLabel}>
                              Gender:
                            </Text>
                            <Text variant="bodyMedium" style={styles.capitalize}>
                              {selectedPet.gender}
                            </Text>
                          </View>

                          {selectedPet.weight > 0 && (
                            <View style={styles.infoRow}>
                              <Text variant="bodyMedium" style={styles.infoLabel}>
                                Weight:
                              </Text>
                              <Text variant="bodyMedium">{selectedPet.weight} lbs</Text>
                            </View>
                          )}

                          {selectedPet.color && (
                            <View style={styles.infoRow}>
                              <Text variant="bodyMedium" style={styles.infoLabel}>
                                Color:
                              </Text>
                              <Text variant="bodyMedium">{selectedPet.color}</Text>
                            </View>
                          )}

                          {selectedPet.microchipId && (
                            <View style={styles.infoRow}>
                              <Text variant="bodyMedium" style={styles.infoLabel}>
                                Microchip:
                              </Text>
                              <Text variant="bodyMedium">{selectedPet.microchipId}</Text>
                            </View>
                          )}

                          {(selectedPet.vetName || selectedPet.vetPhone) && (
                            <>
                              <Divider style={styles.divider} />
                              <Text variant="titleMedium" style={styles.sectionTitle}>
                                Veterinarian
                              </Text>

                              {selectedPet.vetName && (
                                <View style={styles.infoRow}>
                                  <Text variant="bodyMedium" style={styles.infoLabel}>
                                    Name:
                                  </Text>
                                  <Text variant="bodyMedium">{selectedPet.vetName}</Text>
                                </View>
                              )}

                              {selectedPet.vetPhone && (
                                <View style={styles.infoRow}>
                                  <Text variant="bodyMedium" style={styles.infoLabel}>
                                    Phone:
                                  </Text>
                                  <Text variant="bodyMedium">{selectedPet.vetPhone}</Text>
                                </View>
                              )}
                            </>
                          )}

                          {selectedPet.notes && (
                            <>
                              <Divider style={styles.divider} />
                              <Text variant="titleMedium" style={styles.sectionTitle}>
                                Notes
                              </Text>
                              <Text variant="bodyMedium">{selectedPet.notes}</Text>
                            </>
                          )}
                        </Card.Content>
                      </Card>

                      {/* Quick Stats */}
                      <View style={styles.statsRow}>
                        <Card style={styles.statCard}>
                          <Card.Content style={styles.statCardContent}>
                            <IconButton icon="needle" size={24} iconColor="#6200ee" />
                            <Text variant="headlineSmall">{selectedPet.vaccinations.length}</Text>
                            <Text variant="bodySmall">Vaccinations</Text>
                          </Card.Content>
                        </Card>

                        <Card style={styles.statCard}>
                          <Card.Content style={styles.statCardContent}>
                            <IconButton icon="pill" size={24} iconColor="#6200ee" />
                            <Text variant="headlineSmall">{selectedPet.medications.length}</Text>
                            <Text variant="bodySmall">Medications</Text>
                          </Card.Content>
                        </Card>

                        <Card style={styles.statCard}>
                          <Card.Content style={styles.statCardContent}>
                            <IconButton icon="run" size={24} iconColor="#6200ee" />
                            <Text variant="headlineSmall">{selectedPet.activities.length}</Text>
                            <Text variant="bodySmall">Activities</Text>
                          </Card.Content>
                        </Card>
                      </View>
                    </>
                  )}

                  {currentView === 'vaccinations' && (
                    <>
                      <Button
                        mode="contained"
                        onPress={() => setVaccinationModalVisible(true)}
                        style={styles.addButton}
                        icon="plus"
                      >
                        Add Vaccination
                      </Button>

                      {selectedPet.vaccinations.length === 0 ? (
                        <View style={styles.emptySection}>
                          <Text variant="bodyMedium" style={styles.emptySectionText}>
                            No vaccinations recorded
                          </Text>
                        </View>
                      ) : (
                        selectedPet.vaccinations.map(vaccination => (
                          <Card key={vaccination.id} style={styles.recordCard}>
                            <Card.Content>
                              <View style={styles.recordHeader}>
                                <Text variant="titleMedium">{vaccination.name}</Text>
                                <IconButton
                                  icon="delete"
                                  size={20}
                                  iconColor="#d32f2f"
                                  onPress={() => deleteVaccination(vaccination.id)}
                                />
                              </View>

                              <View style={styles.recordDetails}>
                                <Chip icon="calendar" style={styles.recordChip}>
                                  Given: {vaccination.date}
                                </Chip>
                                {vaccination.nextDue && (
                                  <Chip icon="calendar-clock" style={styles.recordChip}>
                                    Due: {vaccination.nextDue}
                                  </Chip>
                                )}
                              </View>

                              {vaccination.veterinarian && (
                                <Text variant="bodySmall" style={styles.recordText}>
                                  Veterinarian: {vaccination.veterinarian}
                                </Text>
                              )}

                              {vaccination.notes && (
                                <Text variant="bodySmall" style={styles.recordNotes}>
                                  {vaccination.notes}
                                </Text>
                              )}
                            </Card.Content>
                          </Card>
                        ))
                      )}
                    </>
                  )}

                  {currentView === 'medications' && (
                    <>
                      <Button
                        mode="contained"
                        onPress={() => setMedicationModalVisible(true)}
                        style={styles.addButton}
                        icon="plus"
                      >
                        Add Medication
                      </Button>

                      {selectedPet.medications.length === 0 ? (
                        <View style={styles.emptySection}>
                          <Text variant="bodyMedium" style={styles.emptySectionText}>
                            No medications recorded
                          </Text>
                        </View>
                      ) : (
                        selectedPet.medications.map(medication => (
                          <Card key={medication.id} style={styles.recordCard}>
                            <Card.Content>
                              <View style={styles.recordHeader}>
                                <Text variant="titleMedium">{medication.name}</Text>
                                <IconButton
                                  icon="delete"
                                  size={20}
                                  iconColor="#d32f2f"
                                  onPress={() => deleteMedication(medication.id)}
                                />
                              </View>

                              {medication.dosage && (
                                <Text variant="bodyMedium" style={styles.recordText}>
                                  Dosage: {medication.dosage}
                                </Text>
                              )}

                              {medication.frequency && (
                                <Text variant="bodyMedium" style={styles.recordText}>
                                  Frequency: {medication.frequency}
                                </Text>
                              )}

                              <View style={styles.recordDetails}>
                                <Chip icon="calendar-start" style={styles.recordChip}>
                                  Start: {medication.startDate}
                                </Chip>
                                {medication.endDate && (
                                  <Chip icon="calendar-end" style={styles.recordChip}>
                                    End: {medication.endDate}
                                  </Chip>
                                )}
                              </View>

                              {medication.notes && (
                                <Text variant="bodySmall" style={styles.recordNotes}>
                                  {medication.notes}
                                </Text>
                              )}
                            </Card.Content>
                          </Card>
                        ))
                      )}
                    </>
                  )}

                  {currentView === 'activities' && (
                    <>
                      <Button
                        mode="contained"
                        onPress={() => setActivityModalVisible(true)}
                        style={styles.addButton}
                        icon="plus"
                      >
                        Log Activity
                      </Button>

                      {selectedPet.activities.length === 0 ? (
                        <View style={styles.emptySection}>
                          <Text variant="bodyMedium" style={styles.emptySectionText}>
                            No activities logged
                          </Text>
                        </View>
                      ) : (
                        selectedPet.activities.map(activity => (
                          <Card key={activity.id} style={styles.recordCard}>
                            <Card.Content>
                              <View style={styles.recordHeader}>
                                <View style={styles.activityHeaderLeft}>
                                  <IconButton
                                    icon={getActivityIcon(activity.type)}
                                    size={24}
                                    iconColor="#6200ee"
                                  />
                                  <View>
                                    <Text variant="titleMedium" style={styles.capitalize}>
                                      {activity.type}
                                    </Text>
                                    <Text variant="bodySmall">{activity.date}</Text>
                                  </View>
                                </View>
                                <IconButton
                                  icon="delete"
                                  size={20}
                                  iconColor="#d32f2f"
                                  onPress={() => deleteActivity(activity.id)}
                                />
                              </View>

                              {activity.duration > 0 && (
                                <Text variant="bodyMedium" style={styles.recordText}>
                                  Duration: {activity.duration} minutes
                                </Text>
                              )}

                              {activity.notes && (
                                <Text variant="bodySmall" style={styles.recordNotes}>
                                  {activity.notes}
                                </Text>
                              )}
                            </Card.Content>
                          </Card>
                        ))
                      )}
                    </>
                  )}

                  <View style={styles.adContainer}>
                    <BannerAd unitId={bannerId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
                  </View>
                </ScrollView>
              </>
            )}
          </>
        )}

        {/* Pet Modal */}
        <Portal>
          <Modal
            visible={petModalVisible}
            onDismiss={() => setPetModalVisible(false)}
            contentContainerStyle={styles.modal}
          >
            <ScrollView>
              <Text variant="titleLarge" style={styles.modalTitle}>
                {editingPet ? 'Edit Pet' : 'Add Pet'}
              </Text>

              <TextInput
                label="Pet Name *"
                value={petForm.name}
                onChangeText={text => setPetForm({ ...petForm, name: text })}
                style={styles.input}
                mode="outlined"
              />

              <Text variant="labelMedium" style={styles.label}>
                Species *
              </Text>
              <View style={styles.categoryGrid}>
                {SPECIES.map(species => (
                  <Chip
                    key={species.value}
                    selected={petForm.species === species.value}
                    onPress={() => setPetForm({ ...petForm, species: species.value as any })}
                    icon={species.icon}
                    style={styles.categoryChip}
                  >
                    {species.label}
                  </Chip>
                ))}
              </View>

              <TextInput
                label="Breed"
                value={petForm.breed}
                onChangeText={text => setPetForm({ ...petForm, breed: text })}
                style={styles.input}
                mode="outlined"
              />

              <View style={styles.row}>
                <TextInput
                  label="Birth Date"
                  value={petForm.birthDate}
                  onChangeText={text => setPetForm({ ...petForm, birthDate: text })}
                  style={[styles.input, styles.halfInput]}
                  mode="outlined"
                  placeholder="YYYY-MM-DD"
                />
                <TextInput
                  label="Weight (lbs)"
                  value={petForm.weight}
                  onChangeText={text => setPetForm({ ...petForm, weight: text })}
                  style={[styles.input, styles.halfInput]}
                  mode="outlined"
                  keyboardType="decimal-pad"
                />
              </View>

              <Text variant="labelMedium" style={styles.label}>
                Gender
              </Text>
              <SegmentedButtons
                value={petForm.gender}
                onValueChange={value => setPetForm({ ...petForm, gender: value as any })}
                buttons={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                ]}
                style={styles.genderButtons}
              />

              <TextInput
                label="Color/Markings"
                value={petForm.color}
                onChangeText={text => setPetForm({ ...petForm, color: text })}
                style={styles.input}
                mode="outlined"
              />

              <TextInput
                label="Microchip ID"
                value={petForm.microchipId}
                onChangeText={text => setPetForm({ ...petForm, microchipId: text })}
                style={styles.input}
                mode="outlined"
              />

              <Divider style={styles.divider} />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Veterinarian Info
              </Text>

              <TextInput
                label="Veterinarian Name"
                value={petForm.vetName}
                onChangeText={text => setPetForm({ ...petForm, vetName: text })}
                style={styles.input}
                mode="outlined"
              />

              <TextInput
                label="Veterinarian Phone"
                value={petForm.vetPhone}
                onChangeText={text => setPetForm({ ...petForm, vetPhone: text })}
                style={styles.input}
                mode="outlined"
                keyboardType="phone-pad"
              />

              <TextInput
                label="Notes"
                value={petForm.notes}
                onChangeText={text => setPetForm({ ...petForm, notes: text })}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setPetModalVisible(false)}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
                <Button mode="contained" onPress={savePet} style={styles.modalButton}>
                  {editingPet ? 'Update' : 'Add'}
                </Button>
              </View>
            </ScrollView>
          </Modal>

          {/* Vaccination Modal */}
          <Modal
            visible={vaccinationModalVisible}
            onDismiss={() => setVaccinationModalVisible(false)}
            contentContainerStyle={styles.modal}
          >
            <Text variant="titleLarge" style={styles.modalTitle}>
              Add Vaccination
            </Text>

            <TextInput
              label="Vaccine Name *"
              value={vaccinationForm.name}
              onChangeText={text => setVaccinationForm({ ...vaccinationForm, name: text })}
              style={styles.input}
              mode="outlined"
            />

            <View style={styles.row}>
              <TextInput
                label="Date Given *"
                value={vaccinationForm.date}
                onChangeText={text => setVaccinationForm({ ...vaccinationForm, date: text })}
                style={[styles.input, styles.halfInput]}
                mode="outlined"
                placeholder="YYYY-MM-DD"
              />
              <TextInput
                label="Next Due Date"
                value={vaccinationForm.nextDue}
                onChangeText={text => setVaccinationForm({ ...vaccinationForm, nextDue: text })}
                style={[styles.input, styles.halfInput]}
                mode="outlined"
                placeholder="YYYY-MM-DD"
              />
            </View>

            <TextInput
              label="Veterinarian"
              value={vaccinationForm.veterinarian}
              onChangeText={text => setVaccinationForm({ ...vaccinationForm, veterinarian: text })}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Notes"
              value={vaccinationForm.notes}
              onChangeText={text => setVaccinationForm({ ...vaccinationForm, notes: text })}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setVaccinationModalVisible(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button mode="contained" onPress={addVaccination} style={styles.modalButton}>
                Add
              </Button>
            </View>
          </Modal>

          {/* Medication Modal */}
          <Modal
            visible={medicationModalVisible}
            onDismiss={() => setMedicationModalVisible(false)}
            contentContainerStyle={styles.modal}
          >
            <Text variant="titleLarge" style={styles.modalTitle}>
              Add Medication
            </Text>

            <TextInput
              label="Medication Name *"
              value={medicationForm.name}
              onChangeText={text => setMedicationForm({ ...medicationForm, name: text })}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Dosage"
              value={medicationForm.dosage}
              onChangeText={text => setMedicationForm({ ...medicationForm, dosage: text })}
              style={styles.input}
              mode="outlined"
              placeholder="e.g., 50mg"
            />

            <TextInput
              label="Frequency"
              value={medicationForm.frequency}
              onChangeText={text => setMedicationForm({ ...medicationForm, frequency: text })}
              style={styles.input}
              mode="outlined"
              placeholder="e.g., Twice daily"
            />

            <View style={styles.row}>
              <TextInput
                label="Start Date *"
                value={medicationForm.startDate}
                onChangeText={text => setMedicationForm({ ...medicationForm, startDate: text })}
                style={[styles.input, styles.halfInput]}
                mode="outlined"
                placeholder="YYYY-MM-DD"
              />
              <TextInput
                label="End Date"
                value={medicationForm.endDate}
                onChangeText={text => setMedicationForm({ ...medicationForm, endDate: text })}
                style={[styles.input, styles.halfInput]}
                mode="outlined"
                placeholder="YYYY-MM-DD"
              />
            </View>

            <TextInput
              label="Notes"
              value={medicationForm.notes}
              onChangeText={text => setMedicationForm({ ...medicationForm, notes: text })}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setMedicationModalVisible(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button mode="contained" onPress={addMedication} style={styles.modalButton}>
                Add
              </Button>
            </View>
          </Modal>

          {/* Activity Modal */}
          <Modal
            visible={activityModalVisible}
            onDismiss={() => setActivityModalVisible(false)}
            contentContainerStyle={styles.modal}
          >
            <Text variant="titleLarge" style={styles.modalTitle}>
              Log Activity
            </Text>

            <Text variant="labelMedium" style={styles.label}>
              Activity Type *
            </Text>
            <View style={styles.categoryGrid}>
              {ACTIVITY_TYPES.map(type => (
                <Chip
                  key={type.value}
                  selected={activityForm.type === type.value}
                  onPress={() => setActivityForm({ ...activityForm, type: type.value as any })}
                  icon={type.icon}
                  style={styles.categoryChip}
                >
                  {type.label}
                </Chip>
              ))}
            </View>

            <TextInput
              label="Duration (minutes)"
              value={activityForm.duration}
              onChangeText={text => setActivityForm({ ...activityForm, duration: text })}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />

            <TextInput
              label="Notes"
              value={activityForm.notes}
              onChangeText={text => setActivityForm({ ...activityForm, notes: text })}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setActivityModalVisible(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button mode="contained" onPress={addActivity} style={styles.modalButton}>
                Add
              </Button>
            </View>
          </Modal>
        </Portal>

        {pets.length > 0 && (
          <FAB icon="plus" style={styles.fab} onPress={() => openPetModal()} />
        )}
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  petSelector: {
    maxHeight: 140,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 8,
    elevation: 2,
  },
  petCard: {
    marginHorizontal: 8,
    minWidth: 100,
  },
  petCardSelected: {
    borderWidth: 2,
    borderColor: '#6200ee',
  },
  petCardContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  petCardName: {
    marginTop: 8,
    fontWeight: 'bold',
  },
  petCardBreed: {
    color: '#666',
  },
  segmentedButtons: {
    margin: 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  infoCard: {
    marginBottom: 16,
    elevation: 2,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  petName: {
    fontWeight: 'bold',
  },
  infoActions: {
    flexDirection: 'row',
  },
  divider: {
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    color: '#666',
    fontWeight: '500',
  },
  capitalize: {
    textTransform: 'capitalize',
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    elevation: 2,
  },
  statCardContent: {
    alignItems: 'center',
  },
  addButton: {
    marginBottom: 16,
  },
  emptySection: {
    padding: 32,
    alignItems: 'center',
  },
  emptySectionText: {
    color: '#999',
  },
  recordCard: {
    marginBottom: 12,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  recordChip: {
    backgroundColor: '#e3f2fd',
  },
  recordText: {
    marginTop: 4,
  },
  recordNotes: {
    marginTop: 8,
    color: '#666',
    fontStyle: 'italic',
  },
  activityHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    color: '#666',
  },
  emptySubtext: {
    marginTop: 8,
    color: '#999',
    textAlign: 'center',
  },
  addFirstButton: {
    marginTop: 24,
  },
  adContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '90%',
  },
  modalTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    marginTop: 8,
    marginBottom: 8,
    color: '#666',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryChip: {
    marginBottom: 4,
  },
  genderButtons: {
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#6200ee',
  },
});
