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
  ProgressBar,
  Divider,
  SegmentedButtons,
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
interface Plant {
  id: string;
  name: string;
  scientificName: string;
  type: 'vegetable' | 'fruit' | 'herb' | 'flower' | 'tree' | 'shrub' | 'other';
  zone: string;
  plantedDate: string;
  harvestDate: string;
  status: 'planning' | 'planted' | 'growing' | 'harvested' | 'removed';
  wateringFrequency: number;
  lastWatered: string;
  sunRequirement: 'full-sun' | 'partial-sun' | 'shade';
  soilType: string;
  spacing: string;
  height: string;
  notes: string;
  careLog: CareLogEntry[];
  createdAt: number;
}

interface CareLogEntry {
  date: string;
  type: 'watering' | 'fertilizing' | 'pruning' | 'harvesting' | 'pest-control' | 'other';
  notes: string;
}

interface GardenZone {
  id: string;
  name: string;
  description: string;
  size: string;
  sunExposure: 'full-sun' | 'partial-sun' | 'shade';
  plantCount: number;
}

// AdMob Configuration
const bannerId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyy';
const interstitialId = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyy';

const interstitial = InterstitialAd.createForAdRequest(interstitialId);

const STORAGE_KEY = '@gardening_planner_plants';
const ZONES_KEY = '@gardening_planner_zones';

const PLANT_TYPES = [
  { label: 'Vegetable', value: 'vegetable', icon: 'carrot', color: '#FF9800' },
  { label: 'Fruit', value: 'fruit', icon: 'fruit-cherries', color: '#E91E63' },
  { label: 'Herb', value: 'herb', icon: 'leaf', color: '#4CAF50' },
  { label: 'Flower', value: 'flower', icon: 'flower', color: '#9C27B0' },
  { label: 'Tree', value: 'tree', icon: 'tree', color: '#795548' },
  { label: 'Shrub', value: 'shrub', icon: 'pine-tree', color: '#8BC34A' },
  { label: 'Other', value: 'other', icon: 'sprout', color: '#607D8B' },
];

const SUN_REQUIREMENTS = [
  { label: 'Full Sun', value: 'full-sun', icon: 'white-balance-sunny' },
  { label: 'Partial Sun', value: 'partial-sun', icon: 'weather-partly-cloudy' },
  { label: 'Shade', value: 'shade', icon: 'weather-cloudy' },
];

const CARE_TYPES = [
  { label: 'Watering', value: 'watering', icon: 'water' },
  { label: 'Fertilizing', value: 'fertilizing', icon: 'cup' },
  { label: 'Pruning', value: 'pruning', icon: 'scissors-cutting' },
  { label: 'Harvesting', value: 'harvesting', icon: 'basket' },
  { label: 'Pest Control', value: 'pest-control', icon: 'bug' },
  { label: 'Other', value: 'other', icon: 'note' },
];

export default function App() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [zones, setZones] = useState<GardenZone[]>([]);
  const [filteredPlants, setFilteredPlants] = useState<Plant[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [zoneModalVisible, setZoneModalVisible] = useState(false);
  const [careLogModalVisible, setCareLogModalVisible] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [editingZone, setEditingZone] = useState<GardenZone | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterZone, setFilterZone] = useState<string>('all');
  const [currentView, setCurrentView] = useState<'plants' | 'zones' | 'watering'>('plants');
  const [menuVisible, setMenuVisible] = useState(false);
  const [interstitialLoaded, setInterstitialLoaded] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    scientificName: '',
    type: 'vegetable' as Plant['type'],
    zone: '',
    plantedDate: new Date().toISOString().split('T')[0],
    harvestDate: '',
    wateringFrequency: '3',
    sunRequirement: 'full-sun' as Plant['sunRequirement'],
    soilType: '',
    spacing: '',
    height: '',
    notes: '',
  });

  const [zoneFormData, setZoneFormData] = useState({
    name: '',
    description: '',
    size: '',
    sunExposure: 'full-sun' as GardenZone['sunExposure'],
  });

  const [careLogData, setCareLogData] = useState({
    type: 'watering' as CareLogEntry['type'],
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

  // Load data from storage
  useEffect(() => {
    loadPlants();
    loadZones();
  }, []);

  // Filter plants
  useEffect(() => {
    let filtered = [...plants];

    if (searchQuery) {
      filtered = filtered.filter(plant =>
        plant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plant.scientificName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plant.notes.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(plant => plant.type === filterType);
    }

    if (filterZone !== 'all') {
      filtered = filtered.filter(plant => plant.zone === filterZone);
    }

    if (currentView === 'watering') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      filtered = filtered.filter(plant => {
        if (!plant.lastWatered || plant.status !== 'planted' && plant.status !== 'growing') {
          return false;
        }
        const lastWatered = new Date(plant.lastWatered);
        lastWatered.setHours(0, 0, 0, 0);
        const daysSinceWatering = Math.floor((today.getTime() - lastWatered.getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceWatering >= plant.wateringFrequency;
      });
    }

    filtered.sort((a, b) => a.name.localeCompare(b.name));
    setFilteredPlants(filtered);
  }, [plants, searchQuery, filterType, filterZone, currentView]);

  const loadPlants = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPlants(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading plants:', error);
    }
  };

  const loadZones = async () => {
    try {
      const stored = await AsyncStorage.getItem(ZONES_KEY);
      if (stored) {
        setZones(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading zones:', error);
    }
  };

  const savePlants = async (newPlants: Plant[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPlants));
      setPlants(newPlants);
      updateZoneCounts(newPlants);
    } catch (error) {
      console.error('Error saving plants:', error);
    }
  };

  const saveZones = async (newZones: GardenZone[]) => {
    try {
      await AsyncStorage.setItem(ZONES_KEY, JSON.stringify(newZones));
      setZones(newZones);
    } catch (error) {
      console.error('Error saving zones:', error);
    }
  };

  const updateZoneCounts = (plantsList: Plant[]) => {
    const zoneCounts: { [key: string]: number } = {};
    plantsList.forEach(plant => {
      if (plant.zone) {
        zoneCounts[plant.zone] = (zoneCounts[plant.zone] || 0) + 1;
      }
    });

    const updatedZones = zones.map(zone => ({
      ...zone,
      plantCount: zoneCounts[zone.name] || 0,
    }));

    if (JSON.stringify(updatedZones) !== JSON.stringify(zones)) {
      saveZones(updatedZones);
    }
  };

  const openModal = (plant?: Plant) => {
    if (plant) {
      setEditingPlant(plant);
      setFormData({
        name: plant.name,
        scientificName: plant.scientificName,
        type: plant.type,
        zone: plant.zone,
        plantedDate: plant.plantedDate,
        harvestDate: plant.harvestDate,
        wateringFrequency: plant.wateringFrequency.toString(),
        sunRequirement: plant.sunRequirement,
        soilType: plant.soilType,
        spacing: plant.spacing,
        height: plant.height,
        notes: plant.notes,
      });
    } else {
      setEditingPlant(null);
      setFormData({
        name: '',
        scientificName: '',
        type: 'vegetable',
        zone: zones.length > 0 ? zones[0].name : '',
        plantedDate: new Date().toISOString().split('T')[0],
        harvestDate: '',
        wateringFrequency: '3',
        sunRequirement: 'full-sun',
        soilType: '',
        spacing: '',
        height: '',
        notes: '',
      });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingPlant(null);
  };

  const savePlant = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter plant name');
      return;
    }

    const plant: Plant = {
      id: editingPlant?.id || Date.now().toString(),
      name: formData.name.trim(),
      scientificName: formData.scientificName.trim(),
      type: formData.type,
      zone: formData.zone,
      plantedDate: formData.plantedDate,
      harvestDate: formData.harvestDate,
      status: editingPlant?.status || 'planning',
      wateringFrequency: parseInt(formData.wateringFrequency) || 3,
      lastWatered: editingPlant?.lastWatered || '',
      sunRequirement: formData.sunRequirement,
      soilType: formData.soilType.trim(),
      spacing: formData.spacing.trim(),
      height: formData.height.trim(),
      notes: formData.notes.trim(),
      careLog: editingPlant?.careLog || [],
      createdAt: editingPlant?.createdAt || Date.now(),
    };

    let newPlants: Plant[];
    if (editingPlant) {
      newPlants = plants.map(p => (p.id === editingPlant.id ? plant : p));
    } else {
      newPlants = [...plants, plant];

      if (newPlants.length % 5 === 0 && interstitialLoaded) {
        interstitial.show();
      }
    }

    await savePlants(newPlants);
    closeModal();
  };

  const deletePlant = (id: string) => {
    Alert.alert('Delete Plant', 'Are you sure you want to delete this plant?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const newPlants = plants.filter(plant => plant.id !== id);
          await savePlants(newPlants);
        },
      },
    ]);
  };

  const updatePlantStatus = async (id: string, status: Plant['status']) => {
    const newPlants = plants.map(plant =>
      plant.id === id ? { ...plant, status } : plant
    );
    await savePlants(newPlants);
  };

  const waterPlant = async (plant: Plant) => {
    const today = new Date().toISOString().split('T')[0];
    const careEntry: CareLogEntry = {
      date: today,
      type: 'watering',
      notes: 'Watered',
    };

    const updatedPlant = {
      ...plant,
      lastWatered: today,
      careLog: [...plant.careLog, careEntry],
    };

    const newPlants = plants.map(p => (p.id === plant.id ? updatedPlant : p));
    await savePlants(newPlants);
  };

  const openCareLogModal = (plant: Plant) => {
    setSelectedPlant(plant);
    setCareLogData({
      type: 'watering',
      notes: '',
    });
    setCareLogModalVisible(true);
  };

  const addCareLog = async () => {
    if (!selectedPlant) return;

    const today = new Date().toISOString().split('T')[0];
    const careEntry: CareLogEntry = {
      date: today,
      type: careLogData.type,
      notes: careLogData.notes.trim(),
    };

    const updatedPlant = {
      ...selectedPlant,
      careLog: [...selectedPlant.careLog, careEntry],
      lastWatered: careLogData.type === 'watering' ? today : selectedPlant.lastWatered,
    };

    const newPlants = plants.map(p => (p.id === selectedPlant.id ? updatedPlant : p));
    await savePlants(newPlants);
    setCareLogModalVisible(false);
  };

  const openZoneModal = (zone?: GardenZone) => {
    if (zone) {
      setEditingZone(zone);
      setZoneFormData({
        name: zone.name,
        description: zone.description,
        size: zone.size,
        sunExposure: zone.sunExposure,
      });
    } else {
      setEditingZone(null);
      setZoneFormData({
        name: '',
        description: '',
        size: '',
        sunExposure: 'full-sun',
      });
    }
    setZoneModalVisible(true);
  };

  const saveZone = async () => {
    if (!zoneFormData.name.trim()) {
      Alert.alert('Error', 'Please enter zone name');
      return;
    }

    const zone: GardenZone = {
      id: editingZone?.id || Date.now().toString(),
      name: zoneFormData.name.trim(),
      description: zoneFormData.description.trim(),
      size: zoneFormData.size.trim(),
      sunExposure: zoneFormData.sunExposure,
      plantCount: editingZone?.plantCount || 0,
    };

    let newZones: GardenZone[];
    if (editingZone) {
      newZones = zones.map(z => (z.id === editingZone.id ? zone : z));
    } else {
      newZones = [...zones, zone];
    }

    await saveZones(newZones);
    setZoneModalVisible(false);
  };

  const deleteZone = (zone: GardenZone) => {
    if (zone.plantCount > 0) {
      Alert.alert('Cannot Delete', 'This zone has plants. Please reassign or remove plants first.');
      return;
    }

    Alert.alert('Delete Zone', 'Are you sure you want to delete this zone?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const newZones = zones.filter(z => z.id !== zone.id);
          await saveZones(newZones);
        },
      },
    ]);
  };

  const getDaysUntilHarvest = (harvestDate: string) => {
    if (!harvestDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const harvest = new Date(harvestDate);
    harvest.setHours(0, 0, 0, 0);
    return Math.floor((harvest.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getWateringStatus = (plant: Plant) => {
    if (!plant.lastWatered) {
      return { status: 'never', color: '#d32f2f', text: 'Never watered' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastWatered = new Date(plant.lastWatered);
    lastWatered.setHours(0, 0, 0, 0);
    const daysSince = Math.floor((today.getTime() - lastWatered.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSince >= plant.wateringFrequency) {
      return { status: 'overdue', color: '#d32f2f', text: `Water needed (${daysSince} days ago)` };
    } else if (daysSince === plant.wateringFrequency - 1) {
      return { status: 'soon', color: '#f57c00', text: 'Water soon' };
    } else {
      return { status: 'good', color: '#388e3c', text: `Watered ${daysSince} days ago` };
    }
  };

  const getTypeInfo = (type: string) => {
    return PLANT_TYPES.find(t => t.value === type) || PLANT_TYPES[PLANT_TYPES.length - 1];
  };

  const getSunIcon = (sunRequirement: string) => {
    return SUN_REQUIREMENTS.find(s => s.value === sunRequirement)?.icon || 'white-balance-sunny';
  };

  const renderPlant = (plant: Plant) => {
    const typeInfo = getTypeInfo(plant.type);
    const wateringStatus = getWateringStatus(plant);
    const daysUntilHarvest = getDaysUntilHarvest(plant.harvestDate);

    return (
      <Card key={plant.id} style={styles.plantCard}>
        <Card.Content>
          <View style={styles.plantHeader}>
            <View style={styles.plantHeaderLeft}>
              <IconButton
                icon={typeInfo.icon}
                size={24}
                iconColor={typeInfo.color}
              />
              <View style={styles.plantHeaderText}>
                <Text variant="titleMedium" style={styles.plantName}>
                  {plant.name}
                </Text>
                {plant.scientificName && (
                  <Text variant="bodySmall" style={styles.scientificName}>
                    {plant.scientificName}
                  </Text>
                )}
              </View>
            </View>
            <Chip
              style={[
                styles.statusChip,
                { backgroundColor: plant.status === 'harvested' ? '#4CAF50' : '#2196F3' },
              ]}
              textStyle={{ color: '#fff', fontSize: 12 }}
            >
              {plant.status}
            </Chip>
          </View>

          <View style={styles.plantDetails}>
            {plant.zone && (
              <Chip icon="map-marker" style={styles.detailChip} textStyle={styles.chipText}>
                {plant.zone}
              </Chip>
            )}
            <Chip
              icon={getSunIcon(plant.sunRequirement)}
              style={styles.detailChip}
              textStyle={styles.chipText}
            >
              {plant.sunRequirement}
            </Chip>
            {daysUntilHarvest !== null && (
              <Chip
                icon="calendar-clock"
                style={styles.detailChip}
                textStyle={styles.chipText}
              >
                {daysUntilHarvest > 0
                  ? `${daysUntilHarvest}d to harvest`
                  : daysUntilHarvest === 0
                  ? 'Harvest today'
                  : 'Past harvest'}
              </Chip>
            )}
          </View>

          <View style={styles.wateringInfo}>
            <IconButton icon="water" size={20} iconColor={wateringStatus.color} />
            <Text variant="bodySmall" style={[styles.wateringText, { color: wateringStatus.color }]}>
              {wateringStatus.text}
            </Text>
            <IconButton
              icon="water-plus"
              size={20}
              iconColor="#2196F3"
              onPress={() => waterPlant(plant)}
            />
          </View>

          {plant.notes && (
            <Text variant="bodySmall" style={styles.plantNotes}>
              {plant.notes}
            </Text>
          )}

          <View style={styles.plantFooter}>
            <View style={styles.plantFooterLeft}>
              <Text variant="bodySmall" style={styles.careLogCount}>
                {plant.careLog.length} care logs
              </Text>
            </View>
            <View style={styles.plantActions}>
              <IconButton
                icon="notebook"
                size={20}
                onPress={() => openCareLogModal(plant)}
              />
              <IconButton
                icon="pencil"
                size={20}
                onPress={() => openModal(plant)}
              />
              <IconButton
                icon="delete"
                size={20}
                iconColor="#d32f2f"
                onPress={() => deletePlant(plant.id)}
              />
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderZone = (zone: GardenZone) => {
    return (
      <Card key={zone.id} style={styles.zoneCard}>
        <Card.Content>
          <View style={styles.zoneHeader}>
            <View style={styles.zoneHeaderLeft}>
              <IconButton icon="grid" size={24} iconColor="#6200ee" />
              <View>
                <Text variant="titleMedium" style={styles.zoneName}>
                  {zone.name}
                </Text>
                <Text variant="bodySmall" style={styles.zonePlantCount}>
                  {zone.plantCount} plants
                </Text>
              </View>
            </View>
            <View style={styles.zoneActions}>
              <IconButton icon="pencil" size={20} onPress={() => openZoneModal(zone)} />
              <IconButton
                icon="delete"
                size={20}
                iconColor="#d32f2f"
                onPress={() => deleteZone(zone)}
              />
            </View>
          </View>

          {zone.description && (
            <Text variant="bodyMedium" style={styles.zoneDescription}>
              {zone.description}
            </Text>
          )}

          <View style={styles.zoneDetails}>
            {zone.size && (
              <Chip icon="ruler" style={styles.detailChip} textStyle={styles.chipText}>
                {zone.size}
              </Chip>
            )}
            <Chip
              icon={getSunIcon(zone.sunExposure)}
              style={styles.detailChip}
              textStyle={styles.chipText}
            >
              {zone.sunExposure}
            </Chip>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <PaperProvider>
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.Content title="Garden Planner" />
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
                setFilterType('all');
                setFilterZone('all');
                setSearchQuery('');
              }}
              title="Clear Filters"
              leadingIcon="filter-off"
            />
          </Menu>
        </Appbar.Header>

        {/* View Tabs */}
        <SegmentedButtons
          value={currentView}
          onValueChange={value => setCurrentView(value as any)}
          buttons={[
            {
              value: 'plants',
              label: `Plants (${plants.length})`,
              icon: 'sprout',
            },
            {
              value: 'zones',
              label: `Zones (${zones.length})`,
              icon: 'grid',
            },
            {
              value: 'watering',
              label: 'Watering',
              icon: 'water',
            },
          ]}
          style={styles.segmentedButtons}
        />

        {currentView === 'plants' && (
          <>
            {/* Search and Filters */}
            <View style={styles.filtersContainer}>
              <Searchbar
                placeholder="Search plants..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchbar}
              />

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
                <Chip
                  selected={filterType === 'all'}
                  onPress={() => setFilterType('all')}
                  style={styles.filterChip}
                >
                  All
                </Chip>
                {PLANT_TYPES.map(type => (
                  <Chip
                    key={type.value}
                    selected={filterType === type.value}
                    onPress={() => setFilterType(type.value)}
                    icon={type.icon}
                    style={styles.filterChip}
                  >
                    {type.label}
                  </Chip>
                ))}
              </ScrollView>

              {zones.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
                  <Chip
                    selected={filterZone === 'all'}
                    onPress={() => setFilterZone('all')}
                    style={styles.filterChip}
                  >
                    All Zones
                  </Chip>
                  {zones.map(zone => (
                    <Chip
                      key={zone.id}
                      selected={filterZone === zone.name}
                      onPress={() => setFilterZone(zone.name)}
                      style={styles.filterChip}
                    >
                      {zone.name}
                    </Chip>
                  ))}
                </ScrollView>
              )}
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
              {filteredPlants.length === 0 ? (
                <View style={styles.emptyState}>
                  <IconButton icon="sprout-outline" size={64} iconColor="#ccc" />
                  <Text variant="titleMedium" style={styles.emptyText}>
                    No plants found
                  </Text>
                  <Text variant="bodyMedium" style={styles.emptySubtext}>
                    {searchQuery || filterType !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Add your first plant to get started'}
                  </Text>
                </View>
              ) : (
                filteredPlants.map(renderPlant)
              )}

              <View style={styles.adContainer}>
                <BannerAd unitId={bannerId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
              </View>
            </ScrollView>
          </>
        )}

        {currentView === 'zones' && (
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            {zones.length === 0 ? (
              <View style={styles.emptyState}>
                <IconButton icon="grid" size={64} iconColor="#ccc" />
                <Text variant="titleMedium" style={styles.emptyText}>
                  No zones created
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtext}>
                  Create zones to organize your garden
                </Text>
              </View>
            ) : (
              zones.map(renderZone)
            )}

            <View style={styles.adContainer}>
              <BannerAd unitId={bannerId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
            </View>
          </ScrollView>
        )}

        {currentView === 'watering' && (
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            {filteredPlants.length === 0 ? (
              <View style={styles.emptyState}>
                <IconButton icon="water-check" size={64} iconColor="#ccc" />
                <Text variant="titleMedium" style={styles.emptyText}>
                  All plants watered!
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtext}>
                  No plants need watering right now
                </Text>
              </View>
            ) : (
              <>
                <Card style={styles.wateringInfo}>
                  <Card.Content>
                    <Text variant="titleMedium">
                      {filteredPlants.length} plant(s) need watering
                    </Text>
                  </Card.Content>
                </Card>
                {filteredPlants.map(renderPlant)}
              </>
            )}

            <View style={styles.adContainer}>
              <BannerAd unitId={bannerId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
            </View>
          </ScrollView>
        )}

        {/* Add/Edit Plant Modal */}
        <Portal>
          <Modal
            visible={modalVisible}
            onDismiss={closeModal}
            contentContainerStyle={styles.modal}
          >
            <ScrollView>
              <Text variant="titleLarge" style={styles.modalTitle}>
                {editingPlant ? 'Edit Plant' : 'Add Plant'}
              </Text>

              <TextInput
                label="Plant Name *"
                value={formData.name}
                onChangeText={text => setFormData({ ...formData, name: text })}
                style={styles.input}
                mode="outlined"
              />

              <TextInput
                label="Scientific Name"
                value={formData.scientificName}
                onChangeText={text => setFormData({ ...formData, scientificName: text })}
                style={styles.input}
                mode="outlined"
              />

              <Text variant="labelMedium" style={styles.label}>
                Plant Type *
              </Text>
              <View style={styles.categoryGrid}>
                {PLANT_TYPES.map(type => (
                  <Chip
                    key={type.value}
                    selected={formData.type === type.value}
                    onPress={() => setFormData({ ...formData, type: type.value as any })}
                    icon={type.icon}
                    style={styles.categoryChip}
                  >
                    {type.label}
                  </Chip>
                ))}
              </View>

              {zones.length > 0 && (
                <>
                  <Text variant="labelMedium" style={styles.label}>
                    Zone
                  </Text>
                  <View style={styles.categoryGrid}>
                    {zones.map(zone => (
                      <Chip
                        key={zone.id}
                        selected={formData.zone === zone.name}
                        onPress={() => setFormData({ ...formData, zone: zone.name })}
                        style={styles.categoryChip}
                      >
                        {zone.name}
                      </Chip>
                    ))}
                  </View>
                </>
              )}

              <Text variant="labelMedium" style={styles.label}>
                Sun Requirement *
              </Text>
              <View style={styles.categoryGrid}>
                {SUN_REQUIREMENTS.map(sun => (
                  <Chip
                    key={sun.value}
                    selected={formData.sunRequirement === sun.value}
                    onPress={() => setFormData({ ...formData, sunRequirement: sun.value as any })}
                    icon={sun.icon}
                    style={styles.categoryChip}
                  >
                    {sun.label}
                  </Chip>
                ))}
              </View>

              <View style={styles.row}>
                <TextInput
                  label="Planted Date"
                  value={formData.plantedDate}
                  onChangeText={text => setFormData({ ...formData, plantedDate: text })}
                  style={[styles.input, styles.halfInput]}
                  mode="outlined"
                  placeholder="YYYY-MM-DD"
                />
                <TextInput
                  label="Harvest Date"
                  value={formData.harvestDate}
                  onChangeText={text => setFormData({ ...formData, harvestDate: text })}
                  style={[styles.input, styles.halfInput]}
                  mode="outlined"
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <TextInput
                label="Watering Frequency (days)"
                value={formData.wateringFrequency}
                onChangeText={text => setFormData({ ...formData, wateringFrequency: text })}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
              />

              <View style={styles.row}>
                <TextInput
                  label="Spacing"
                  value={formData.spacing}
                  onChangeText={text => setFormData({ ...formData, spacing: text })}
                  style={[styles.input, styles.halfInput]}
                  mode="outlined"
                  placeholder="e.g., 12 inches"
                />
                <TextInput
                  label="Height"
                  value={formData.height}
                  onChangeText={text => setFormData({ ...formData, height: text })}
                  style={[styles.input, styles.halfInput]}
                  mode="outlined"
                  placeholder="e.g., 3 feet"
                />
              </View>

              <TextInput
                label="Soil Type"
                value={formData.soilType}
                onChangeText={text => setFormData({ ...formData, soilType: text })}
                style={styles.input}
                mode="outlined"
              />

              <TextInput
                label="Notes"
                value={formData.notes}
                onChangeText={text => setFormData({ ...formData, notes: text })}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalActions}>
                <Button mode="outlined" onPress={closeModal} style={styles.modalButton}>
                  Cancel
                </Button>
                <Button mode="contained" onPress={savePlant} style={styles.modalButton}>
                  {editingPlant ? 'Update' : 'Add'}
                </Button>
              </View>
            </ScrollView>
          </Modal>

          {/* Zone Modal */}
          <Modal
            visible={zoneModalVisible}
            onDismiss={() => setZoneModalVisible(false)}
            contentContainerStyle={styles.modal}
          >
            <Text variant="titleLarge" style={styles.modalTitle}>
              {editingZone ? 'Edit Zone' : 'Add Zone'}
            </Text>

            <TextInput
              label="Zone Name *"
              value={zoneFormData.name}
              onChangeText={text => setZoneFormData({ ...zoneFormData, name: text })}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Description"
              value={zoneFormData.description}
              onChangeText={text => setZoneFormData({ ...zoneFormData, description: text })}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={2}
            />

            <TextInput
              label="Size"
              value={zoneFormData.size}
              onChangeText={text => setZoneFormData({ ...zoneFormData, size: text })}
              style={styles.input}
              mode="outlined"
              placeholder="e.g., 10x10 ft"
            />

            <Text variant="labelMedium" style={styles.label}>
              Sun Exposure *
            </Text>
            <View style={styles.categoryGrid}>
              {SUN_REQUIREMENTS.map(sun => (
                <Chip
                  key={sun.value}
                  selected={zoneFormData.sunExposure === sun.value}
                  onPress={() => setZoneFormData({ ...zoneFormData, sunExposure: sun.value as any })}
                  icon={sun.icon}
                  style={styles.categoryChip}
                >
                  {sun.label}
                </Chip>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setZoneModalVisible(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button mode="contained" onPress={saveZone} style={styles.modalButton}>
                {editingZone ? 'Update' : 'Add'}
              </Button>
            </View>
          </Modal>

          {/* Care Log Modal */}
          <Modal
            visible={careLogModalVisible}
            onDismiss={() => setCareLogModalVisible(false)}
            contentContainerStyle={styles.modal}
          >
            <Text variant="titleLarge" style={styles.modalTitle}>
              Add Care Log
            </Text>

            {selectedPlant && (
              <Text variant="bodyLarge" style={styles.selectedPlantText}>
                {selectedPlant.name}
              </Text>
            )}

            <Text variant="labelMedium" style={styles.label}>
              Care Type *
            </Text>
            <View style={styles.categoryGrid}>
              {CARE_TYPES.map(type => (
                <Chip
                  key={type.value}
                  selected={careLogData.type === type.value}
                  onPress={() => setCareLogData({ ...careLogData, type: type.value as any })}
                  icon={type.icon}
                  style={styles.categoryChip}
                >
                  {type.label}
                </Chip>
              ))}
            </View>

            <TextInput
              label="Notes"
              value={careLogData.notes}
              onChangeText={text => setCareLogData({ ...careLogData, notes: text })}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setCareLogModalVisible(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button mode="contained" onPress={addCareLog} style={styles.modalButton}>
                Add Log
              </Button>
            </View>
          </Modal>
        </Portal>

        <FAB
          icon={currentView === 'zones' ? 'plus' : 'plus'}
          style={styles.fab}
          onPress={() => {
            if (currentView === 'zones') {
              openZoneModal();
            } else {
              openModal();
            }
          }}
        />
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  segmentedButtons: {
    margin: 16,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 8,
    elevation: 2,
  },
  searchbar: {
    marginBottom: 8,
    elevation: 0,
    backgroundColor: '#f5f5f5',
  },
  filterChips: {
    marginBottom: 8,
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
  plantCard: {
    marginBottom: 12,
    elevation: 2,
  },
  plantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  plantHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  plantHeaderText: {
    flex: 1,
  },
  plantName: {
    fontWeight: 'bold',
  },
  scientificName: {
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
  },
  statusChip: {
    height: 24,
  },
  plantDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  detailChip: {
    backgroundColor: '#e3f2fd',
    height: 28,
  },
  chipText: {
    fontSize: 12,
  },
  wateringInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  wateringText: {
    flex: 1,
    marginLeft: -8,
  },
  plantNotes: {
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 8,
  },
  plantFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  plantFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  careLogCount: {
    color: '#666',
  },
  plantActions: {
    flexDirection: 'row',
  },
  zoneCard: {
    marginBottom: 12,
    elevation: 2,
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  zoneHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  zoneName: {
    fontWeight: 'bold',
  },
  zonePlantCount: {
    color: '#666',
    marginTop: 2,
  },
  zoneDescription: {
    color: '#666',
    marginBottom: 12,
  },
  zoneDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  zoneActions: {
    flexDirection: 'row',
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
  },
  selectedPlantText: {
    marginBottom: 16,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#6200ee',
  },
});
