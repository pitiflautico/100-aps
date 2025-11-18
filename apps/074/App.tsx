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
  IconButton,
  Menu,
  Divider,
  SegmentedButtons,
  Checkbox,
  List,
  ProgressBar,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';

// TypeScript Interfaces
interface Person {
  id: string;
  name: string;
  relationship: Relationship;
  birthday?: string;
  budget: number;
  gifts: Gift[];
  createdAt: number;
}

interface Gift {
  id: string;
  idea: string;
  occasion: Occasion;
  price: number;
  purchased: boolean;
  notes: string;
  createdAt: number;
}

type Relationship = 'family' | 'friend' | 'colleague' | 'partner' | 'other';
type Occasion = 'birthday' | 'christmas' | 'anniversary' | 'valentines' | 'wedding' | 'graduation' | 'other';

// AdMob Configuration
const bannerId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyy';

const STORAGE_KEY = '@gift_planner_data';

const RELATIONSHIPS: { label: string; value: Relationship; icon: string; color: string }[] = [
  { label: 'Family', value: 'family', icon: 'account-group', color: '#E91E63' },
  { label: 'Friend', value: 'friend', icon: 'account-heart', color: '#2196F3' },
  { label: 'Colleague', value: 'colleague', icon: 'briefcase', color: '#FF9800' },
  { label: 'Partner', value: 'partner', icon: 'heart', color: '#F44336' },
  { label: 'Other', value: 'other', icon: 'account', color: '#607D8B' },
];

const OCCASIONS: { label: string; value: Occasion; icon: string; color: string }[] = [
  { label: 'Birthday', value: 'birthday', icon: 'cake-variant', color: '#E91E63' },
  { label: 'Christmas', value: 'christmas', icon: 'pine-tree', color: '#4CAF50' },
  { label: 'Anniversary', value: 'anniversary', icon: 'heart', color: '#F44336' },
  { label: 'Valentines', value: 'valentines', icon: 'heart-multiple', color: '#E91E63' },
  { label: 'Wedding', value: 'wedding', icon: 'ring', color: '#9C27B0' },
  { label: 'Graduation', value: 'graduation', icon: 'school', color: '#2196F3' },
  { label: 'Other', value: 'other', icon: 'gift', color: '#607D8B' },
];

export default function App() {
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [filterRelationship, setFilterRelationship] = useState<string>('all');

  const [personModalVisible, setPersonModalVisible] = useState(false);
  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [editingGift, setEditingGift] = useState<Gift | null>(null);

  const [menuVisible, setMenuVisible] = useState(false);
  const [currentView, setCurrentView] = useState<'all' | 'upcoming'>('all');

  // Form state
  const [personForm, setPersonForm] = useState({
    name: '',
    relationship: 'friend' as Relationship,
    birthday: '',
    budget: '',
  });

  const [giftForm, setGiftForm] = useState({
    idea: '',
    occasion: 'birthday' as Occasion,
    price: '',
    notes: '',
  });

  useEffect(() => {
    loadPeople();
  }, []);

  const loadPeople = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPeople(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading people:', error);
    }
  };

  const savePeople = async (newPeople: Person[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPeople));
      setPeople(newPeople);
    } catch (error) {
      console.error('Error saving people:', error);
    }
  };

  const openPersonModal = (person?: Person) => {
    if (person) {
      setEditingPerson(person);
      setPersonForm({
        name: person.name,
        relationship: person.relationship,
        birthday: person.birthday || '',
        budget: person.budget.toString(),
      });
    } else {
      setEditingPerson(null);
      setPersonForm({
        name: '',
        relationship: 'friend',
        birthday: '',
        budget: '',
      });
    }
    setPersonModalVisible(true);
  };

  const savePerson = () => {
    if (!personForm.name.trim()) {
      Alert.alert('Error', 'Please enter person name');
      return;
    }

    const person: Person = {
      id: editingPerson?.id || Date.now().toString(),
      name: personForm.name.trim(),
      relationship: personForm.relationship,
      birthday: personForm.birthday.trim(),
      budget: parseFloat(personForm.budget) || 0,
      gifts: editingPerson?.gifts || [],
      createdAt: editingPerson?.createdAt || Date.now(),
    };

    let newPeople: Person[];
    if (editingPerson) {
      newPeople = people.map(p => (p.id === editingPerson.id ? person : p));
    } else {
      newPeople = [...people, person];
    }

    savePeople(newPeople);
    setPersonModalVisible(false);
  };

  const deletePerson = (id: string) => {
    Alert.alert('Delete Person', 'This will delete all gift ideas for this person. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const newPeople = people.filter(p => p.id !== id);
          await savePeople(newPeople);
          if (selectedPerson?.id === id) {
            setViewModalVisible(false);
          }
        },
      },
    ]);
  };

  const openGiftModal = (person: Person, gift?: Gift) => {
    setSelectedPerson(person);
    if (gift) {
      setEditingGift(gift);
      setGiftForm({
        idea: gift.idea,
        occasion: gift.occasion,
        price: gift.price.toString(),
        notes: gift.notes,
      });
    } else {
      setEditingGift(null);
      setGiftForm({
        idea: '',
        occasion: 'birthday',
        price: '',
        notes: '',
      });
    }
    setGiftModalVisible(true);
  };

  const saveGift = () => {
    if (!selectedPerson) return;
    if (!giftForm.idea.trim()) {
      Alert.alert('Error', 'Please enter gift idea');
      return;
    }

    const gift: Gift = {
      id: editingGift?.id || Date.now().toString(),
      idea: giftForm.idea.trim(),
      occasion: giftForm.occasion,
      price: parseFloat(giftForm.price) || 0,
      purchased: editingGift?.purchased || false,
      notes: giftForm.notes.trim(),
      createdAt: editingGift?.createdAt || Date.now(),
    };

    const updatedPerson = {
      ...selectedPerson,
      gifts: editingGift
        ? selectedPerson.gifts.map(g => (g.id === editingGift.id ? gift : g))
        : [...selectedPerson.gifts, gift],
    };

    const newPeople = people.map(p => (p.id === selectedPerson.id ? updatedPerson : p));
    savePeople(newPeople);
    setGiftModalVisible(false);

    if (viewModalVisible) {
      setSelectedPerson(updatedPerson);
    }
  };

  const toggleGiftPurchased = (personId: string, giftId: string) => {
    const newPeople = people.map(person => {
      if (person.id === personId) {
        return {
          ...person,
          gifts: person.gifts.map(gift =>
            gift.id === giftId ? { ...gift, purchased: !gift.purchased } : gift
          ),
        };
      }
      return person;
    });
    savePeople(newPeople);

    if (selectedPerson?.id === personId) {
      const updatedPerson = newPeople.find(p => p.id === personId);
      if (updatedPerson) {
        setSelectedPerson(updatedPerson);
      }
    }
  };

  const deleteGift = (personId: string, giftId: string) => {
    Alert.alert('Delete Gift Idea', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const newPeople = people.map(person => {
            if (person.id === personId) {
              return {
                ...person,
                gifts: person.gifts.filter(g => g.id !== giftId),
              };
            }
            return person;
          });
          savePeople(newPeople);

          if (selectedPerson?.id === personId) {
            const updatedPerson = newPeople.find(p => p.id === personId);
            if (updatedPerson) {
              setSelectedPerson(updatedPerson);
            }
          }
        },
      },
    ]);
  };

  const viewPerson = (person: Person) => {
    setSelectedPerson(person);
    setViewModalVisible(true);
  };

  const getRelationshipInfo = (relationship: Relationship) => {
    return RELATIONSHIPS.find(r => r.value === relationship) || RELATIONSHIPS[RELATIONSHIPS.length - 1];
  };

  const getOccasionInfo = (occasion: Occasion) => {
    return OCCASIONS.find(o => o.value === occasion) || OCCASIONS[OCCASIONS.length - 1];
  };

  const getTotalSpent = (person: Person): number => {
    return person.gifts.filter(g => g.purchased).reduce((sum, g) => sum + g.price, 0);
  };

  const getBudgetProgress = (person: Person): number => {
    if (person.budget === 0) return 0;
    return Math.min(getTotalSpent(person) / person.budget, 1);
  };

  const getFilteredPeople = () => {
    let filtered = [...people];

    if (filterRelationship !== 'all') {
      filtered = filtered.filter(p => p.relationship === filterRelationship);
    }

    // Sort by name
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    return filtered;
  };

  const renderPersonCard = (person: Person) => {
    const relationshipInfo = getRelationshipInfo(person.relationship);
    const totalSpent = getTotalSpent(person);
    const budgetProgress = getBudgetProgress(person);
    const purchasedCount = person.gifts.filter(g => g.purchased).length;

    return (
      <Card key={person.id} style={styles.personCard} onPress={() => viewPerson(person)}>
        <Card.Content>
          <View style={styles.personHeader}>
            <View style={styles.personHeaderLeft}>
              <IconButton
                icon={relationshipInfo.icon}
                size={28}
                iconColor={relationshipInfo.color}
              />
              <View style={styles.personHeaderText}>
                <Text variant="titleMedium" style={styles.personName}>
                  {person.name}
                </Text>
                {person.birthday && (
                  <Text variant="bodySmall" style={styles.personBirthday}>
                    Birthday: {person.birthday}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.personStats}>
            <Chip
              icon="gift"
              style={styles.statChip}
              textStyle={styles.chipText}
            >
              {person.gifts.length} ideas
            </Chip>
            <Chip
              icon="check-circle"
              style={styles.statChip}
              textStyle={styles.chipText}
            >
              {purchasedCount} purchased
            </Chip>
          </View>

          {person.budget > 0 && (
            <View style={styles.budgetSection}>
              <View style={styles.budgetHeader}>
                <Text variant="bodySmall" style={styles.budgetLabel}>
                  Budget
                </Text>
                <Text variant="bodySmall" style={styles.budgetAmount}>
                  ${totalSpent.toFixed(2)} / ${person.budget.toFixed(2)}
                </Text>
              </View>
              <ProgressBar
                progress={budgetProgress}
                color={budgetProgress > 1 ? '#F44336' : '#4CAF50'}
                style={styles.progressBar}
              />
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const filteredPeople = getFilteredPeople();
  const totalBudget = people.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = people.reduce((sum, p) => sum + getTotalSpent(p), 0);

  return (
    <PaperProvider>
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.Content title="Gift Planner" />
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={<Appbar.Action icon="dots-vertical" onPress={() => setMenuVisible(true)} />}
          >
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                setFilterRelationship('all');
              }}
              title="Clear Filters"
              leadingIcon="filter-off"
            />
          </Menu>
        </Appbar.Header>

        {/* Budget Overview */}
        {totalBudget > 0 && (
          <Card style={styles.overviewCard}>
            <Card.Content>
              <Text variant="labelLarge" style={styles.overviewLabel}>
                Total Budget Overview
              </Text>
              <View style={styles.overviewStats}>
                <View style={styles.overviewStat}>
                  <Text variant="headlineSmall" style={styles.overviewAmount}>
                    ${totalSpent.toFixed(2)}
                  </Text>
                  <Text variant="bodySmall" style={styles.overviewStatLabel}>
                    Spent
                  </Text>
                </View>
                <Divider style={styles.overviewDivider} />
                <View style={styles.overviewStat}>
                  <Text variant="headlineSmall" style={styles.overviewAmount}>
                    ${totalBudget.toFixed(2)}
                  </Text>
                  <Text variant="bodySmall" style={styles.overviewStatLabel}>
                    Budget
                  </Text>
                </View>
                <Divider style={styles.overviewDivider} />
                <View style={styles.overviewStat}>
                  <Text variant="headlineSmall" style={styles.overviewAmount}>
                    ${(totalBudget - totalSpent).toFixed(2)}
                  </Text>
                  <Text variant="bodySmall" style={styles.overviewStatLabel}>
                    Remaining
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Chip
              selected={filterRelationship === 'all'}
              onPress={() => setFilterRelationship('all')}
              style={styles.filterChip}
            >
              All
            </Chip>
            {RELATIONSHIPS.map(rel => (
              <Chip
                key={rel.value}
                selected={filterRelationship === rel.value}
                onPress={() => setFilterRelationship(rel.value)}
                icon={rel.icon}
                style={styles.filterChip}
              >
                {rel.label}
              </Chip>
            ))}
          </ScrollView>
        </View>

        {/* People List */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {filteredPeople.length === 0 ? (
            <View style={styles.emptyState}>
              <IconButton icon="gift-outline" size={64} iconColor="#ccc" />
              <Text variant="titleMedium" style={styles.emptyText}>
                {people.length === 0 ? 'No people yet' : 'No people found'}
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>
                {people.length === 0
                  ? 'Add people to start planning gifts'
                  : 'Try adjusting your filters'}
              </Text>
            </View>
          ) : (
            filteredPeople.map(renderPersonCard)
          )}

          <View style={styles.adContainer}>
            <BannerAd unitId={bannerId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
          </View>
        </ScrollView>

        {/* Add/Edit Person Modal */}
        <Portal>
          <Modal
            visible={personModalVisible}
            onDismiss={() => setPersonModalVisible(false)}
            contentContainerStyle={styles.modal}
          >
            <ScrollView>
              <Text variant="titleLarge" style={styles.modalTitle}>
                {editingPerson ? 'Edit Person' : 'Add Person'}
              </Text>

              <TextInput
                label="Name *"
                value={personForm.name}
                onChangeText={text => setPersonForm({ ...personForm, name: text })}
                style={styles.input}
                mode="outlined"
              />

              <Text variant="labelMedium" style={styles.label}>
                Relationship
              </Text>
              <View style={styles.relationshipGrid}>
                {RELATIONSHIPS.map(rel => (
                  <Chip
                    key={rel.value}
                    selected={personForm.relationship === rel.value}
                    onPress={() => setPersonForm({ ...personForm, relationship: rel.value })}
                    icon={rel.icon}
                    style={styles.relationshipChip}
                  >
                    {rel.label}
                  </Chip>
                ))}
              </View>

              <TextInput
                label="Birthday (optional)"
                value={personForm.birthday}
                onChangeText={text => setPersonForm({ ...personForm, birthday: text })}
                style={styles.input}
                mode="outlined"
                placeholder="MM/DD"
              />

              <TextInput
                label="Budget"
                value={personForm.budget}
                onChangeText={text => setPersonForm({ ...personForm, budget: text })}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
                left={<TextInput.Icon icon="currency-usd" />}
              />

              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setPersonModalVisible(false)}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
                <Button mode="contained" onPress={savePerson} style={styles.modalButton}>
                  {editingPerson ? 'Update' : 'Add'}
                </Button>
              </View>
            </ScrollView>
          </Modal>

          {/* View Person Modal */}
          <Modal
            visible={viewModalVisible}
            onDismiss={() => setViewModalVisible(false)}
            contentContainerStyle={styles.modal}
          >
            {selectedPerson && (
              <ScrollView>
                <View style={styles.viewHeader}>
                  <View style={styles.viewHeaderLeft}>
                    <IconButton
                      icon={getRelationshipInfo(selectedPerson.relationship).icon}
                      size={36}
                      iconColor={getRelationshipInfo(selectedPerson.relationship).color}
                    />
                    <Text variant="headlineSmall" style={styles.viewTitle}>
                      {selectedPerson.name}
                    </Text>
                  </View>
                  <View style={styles.viewActions}>
                    <IconButton
                      icon="pencil"
                      size={24}
                      onPress={() => {
                        setViewModalVisible(false);
                        openPersonModal(selectedPerson);
                      }}
                    />
                    <IconButton
                      icon="delete"
                      size={24}
                      iconColor="#d32f2f"
                      onPress={() => deletePerson(selectedPerson.id)}
                    />
                  </View>
                </View>

                {selectedPerson.birthday && (
                  <Text variant="bodyMedium" style={styles.viewBirthday}>
                    Birthday: {selectedPerson.birthday}
                  </Text>
                )}

                {selectedPerson.budget > 0 && (
                  <View style={styles.viewBudget}>
                    <Text variant="labelMedium">Budget Tracking</Text>
                    <Text variant="headlineSmall" style={styles.viewBudgetAmount}>
                      ${getTotalSpent(selectedPerson).toFixed(2)} / ${selectedPerson.budget.toFixed(2)}
                    </Text>
                    <ProgressBar
                      progress={getBudgetProgress(selectedPerson)}
                      color={getBudgetProgress(selectedPerson) > 1 ? '#F44336' : '#4CAF50'}
                      style={styles.progressBar}
                    />
                  </View>
                )}

                <Divider style={styles.divider} />

                <View style={styles.giftsHeader}>
                  <Text variant="titleMedium">Gift Ideas ({selectedPerson.gifts.length})</Text>
                  <Button
                    mode="contained"
                    icon="plus"
                    onPress={() => openGiftModal(selectedPerson)}
                  >
                    Add Gift
                  </Button>
                </View>

                {selectedPerson.gifts.length === 0 ? (
                  <Text variant="bodyMedium" style={styles.noGifts}>
                    No gift ideas yet
                  </Text>
                ) : (
                  selectedPerson.gifts.map(gift => {
                    const occasionInfo = getOccasionInfo(gift.occasion);
                    return (
                      <Card key={gift.id} style={styles.giftCard}>
                        <Card.Content>
                          <View style={styles.giftHeader}>
                            <Checkbox
                              status={gift.purchased ? 'checked' : 'unchecked'}
                              onPress={() => toggleGiftPurchased(selectedPerson.id, gift.id)}
                            />
                            <View style={styles.giftContent}>
                              <Text
                                variant="titleSmall"
                                style={[
                                  styles.giftIdea,
                                  gift.purchased && styles.giftPurchased,
                                ]}
                              >
                                {gift.idea}
                              </Text>
                              <View style={styles.giftDetails}>
                                <Chip
                                  icon={occasionInfo.icon}
                                  style={[styles.occasionChip, { backgroundColor: occasionInfo.color + '20' }]}
                                  textStyle={[styles.chipText, { color: occasionInfo.color }]}
                                >
                                  {occasionInfo.label}
                                </Chip>
                                {gift.price > 0 && (
                                  <Chip style={styles.priceChip} textStyle={styles.chipText}>
                                    ${gift.price.toFixed(2)}
                                  </Chip>
                                )}
                              </View>
                              {gift.notes && (
                                <Text variant="bodySmall" style={styles.giftNotes}>
                                  {gift.notes}
                                </Text>
                              )}
                            </View>
                            <View style={styles.giftActions}>
                              <IconButton
                                icon="pencil"
                                size={20}
                                onPress={() => {
                                  setViewModalVisible(false);
                                  openGiftModal(selectedPerson, gift);
                                }}
                              />
                              <IconButton
                                icon="delete"
                                size={20}
                                iconColor="#d32f2f"
                                onPress={() => deleteGift(selectedPerson.id, gift.id)}
                              />
                            </View>
                          </View>
                        </Card.Content>
                      </Card>
                    );
                  })
                )}

                <Button
                  mode="contained"
                  onPress={() => setViewModalVisible(false)}
                  style={styles.closeButton}
                >
                  Close
                </Button>
              </ScrollView>
            )}
          </Modal>

          {/* Add/Edit Gift Modal */}
          <Modal
            visible={giftModalVisible}
            onDismiss={() => setGiftModalVisible(false)}
            contentContainerStyle={styles.modal}
          >
            <ScrollView>
              <Text variant="titleLarge" style={styles.modalTitle}>
                {editingGift ? 'Edit Gift Idea' : 'Add Gift Idea'}
              </Text>

              <TextInput
                label="Gift Idea *"
                value={giftForm.idea}
                onChangeText={text => setGiftForm({ ...giftForm, idea: text })}
                style={styles.input}
                mode="outlined"
              />

              <Text variant="labelMedium" style={styles.label}>
                Occasion
              </Text>
              <View style={styles.occasionGrid}>
                {OCCASIONS.map(occ => (
                  <Chip
                    key={occ.value}
                    selected={giftForm.occasion === occ.value}
                    onPress={() => setGiftForm({ ...giftForm, occasion: occ.value })}
                    icon={occ.icon}
                    style={styles.occasionChipSelect}
                  >
                    {occ.label}
                  </Chip>
                ))}
              </View>

              <TextInput
                label="Price"
                value={giftForm.price}
                onChangeText={text => setGiftForm({ ...giftForm, price: text })}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
                left={<TextInput.Icon icon="currency-usd" />}
              />

              <TextInput
                label="Notes"
                value={giftForm.notes}
                onChangeText={text => setGiftForm({ ...giftForm, notes: text })}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setGiftModalVisible(false)}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
                <Button mode="contained" onPress={saveGift} style={styles.modalButton}>
                  {editingGift ? 'Update' : 'Add'}
                </Button>
              </View>
            </ScrollView>
          </Modal>
        </Portal>

        <FAB icon="plus" style={styles.fab} onPress={() => openPersonModal()} />
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  overviewCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  overviewLabel: {
    marginBottom: 12,
    color: '#666',
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  overviewStat: {
    alignItems: 'center',
    flex: 1,
  },
  overviewAmount: {
    fontWeight: 'bold',
    color: '#6200ee',
  },
  overviewStatLabel: {
    color: '#999',
    marginTop: 4,
  },
  overviewDivider: {
    width: 1,
    height: 40,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
  },
  filterChip: {
    marginRight: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  personCard: {
    marginBottom: 12,
    elevation: 2,
  },
  personHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  personHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  personHeaderText: {
    flex: 1,
  },
  personName: {
    fontWeight: 'bold',
  },
  personBirthday: {
    color: '#666',
    marginTop: 2,
  },
  personStats: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  statChip: {
    backgroundColor: '#e3f2fd',
    height: 28,
  },
  chipText: {
    fontSize: 12,
  },
  budgetSection: {
    marginTop: 8,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  budgetLabel: {
    color: '#666',
  },
  budgetAmount: {
    fontWeight: 'bold',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
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
  label: {
    marginTop: 8,
    marginBottom: 8,
    color: '#666',
  },
  relationshipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  relationshipChip: {
    marginBottom: 4,
  },
  occasionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  occasionChipSelect: {
    marginBottom: 4,
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
  viewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  viewHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  viewTitle: {
    fontWeight: 'bold',
    flex: 1,
  },
  viewActions: {
    flexDirection: 'row',
  },
  viewBirthday: {
    color: '#666',
    marginBottom: 12,
  },
  viewBudget: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  viewBudgetAmount: {
    fontWeight: 'bold',
    marginVertical: 8,
  },
  divider: {
    marginVertical: 16,
  },
  giftsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  noGifts: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 24,
  },
  giftCard: {
    marginBottom: 8,
    elevation: 1,
  },
  giftHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  giftContent: {
    flex: 1,
  },
  giftIdea: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  giftPurchased: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  giftDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  occasionChip: {
    height: 24,
  },
  priceChip: {
    backgroundColor: '#E8F5E9',
    height: 24,
  },
  giftNotes: {
    color: '#666',
    fontStyle: 'italic',
  },
  giftActions: {
    flexDirection: 'row',
  },
  closeButton: {
    marginTop: 24,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#6200ee',
  },
});
