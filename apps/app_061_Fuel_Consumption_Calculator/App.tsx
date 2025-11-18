import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  TextInput,
  Modal,
  ScrollView,
  Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Fuel_Consumption_Tracker_data';
const { width } = Dimensions.get('window');

type FuelType = 'Regular' | 'Premium' | 'Diesel';
type UnitSystem = 'Imperial' | 'Metric';

interface FillUp {
  id: string;
  date: string;
  liters: number;
  cost: number;
  odometer: number;
  fuelType: FuelType;
  tripDistance?: number;
  consumption?: number;
  costPerUnit?: number;
}

interface Stats {
  averageConsumption: number;
  totalSpent: number;
  totalDistance: number;
  totalFuel: number;
  averageCostPerUnit: number;
}

export default function App() {
  const [fillUps, setFillUps] = useState<FillUp[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('Metric');
  const [selectedFuelType, setSelectedFuelType] = useState<FuelType>('Regular');
  const [actionCount, setActionCount] = useState(0);

  // Form states
  const [liters, setLiters] = useState('');
  const [cost, setCost] = useState('');
  const [odometer, setOdometer] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    initializeAds();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setFillUps(data.fillUps || []);
        setUnitSystem(data.unitSystem || 'Metric');
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveData = async (newFillUps: FillUp[], newUnit?: UnitSystem) => {
    try {
      const data = {
        fillUps: newFillUps,
        unitSystem: newUnit || unitSystem,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setFillUps(newFillUps);
      if (newUnit) setUnitSystem(newUnit);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const calculateConsumption = (fillUp: FillUp, prevOdometer: number): FillUp => {
    const tripDistance = fillUp.odometer - prevOdometer;
    let consumption = 0;

    if (tripDistance > 0 && fillUp.liters > 0) {
      if (unitSystem === 'Metric') {
        // L/100km
        consumption = (fillUp.liters / tripDistance) * 100;
      } else {
        // MPG
        const gallons = fillUp.liters / 3.78541;
        const miles = tripDistance * 0.621371;
        consumption = miles / gallons;
      }
    }

    const costPerUnit = tripDistance > 0 ? fillUp.cost / tripDistance : 0;

    return {
      ...fillUp,
      tripDistance,
      consumption,
      costPerUnit,
    };
  };

  const addFillUp = () => {
    if (!liters || !cost || !odometer) return;

    const newFillUp: FillUp = {
      id: Date.now().toString(),
      date,
      liters: parseFloat(liters),
      cost: parseFloat(cost),
      odometer: parseFloat(odometer),
      fuelType: selectedFuelType,
    };

    let updatedFillUp = newFillUp;

    // Calculate consumption if there's a previous fill-up
    if (fillUps.length > 0) {
      const sortedFillUps = [...fillUps].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const prevFillUp = sortedFillUps[0];
      if (newFillUp.odometer > prevFillUp.odometer) {
        updatedFillUp = calculateConsumption(newFillUp, prevFillUp.odometer);
      }
    }

    const newFillUps = [updatedFillUp, ...fillUps];
    saveData(newFillUps);

    // Reset form
    setLiters('');
    setCost('');
    setOdometer('');
    setDate(new Date().toISOString().split('T')[0]);
    setSelectedFuelType('Regular');
    setShowModal(false);

    const newCount = actionCount + 1;
    setActionCount(newCount);
    if (newCount % 5 === 0) showInterstitialAd();
  };

  const deleteFillUp = (id: string) => {
    saveData(fillUps.filter(f => f.id !== id));
  };

  const calculateStats = (): Stats => {
    if (fillUps.length === 0) {
      return {
        averageConsumption: 0,
        totalSpent: 0,
        totalDistance: 0,
        totalFuel: 0,
        averageCostPerUnit: 0,
      };
    }

    const totalSpent = fillUps.reduce((sum, f) => sum + f.cost, 0);
    const totalFuel = fillUps.reduce((sum, f) => sum + f.liters, 0);
    const fillUpsWithConsumption = fillUps.filter(f => f.consumption && f.consumption > 0);
    const averageConsumption = fillUpsWithConsumption.length > 0
      ? fillUpsWithConsumption.reduce((sum, f) => sum + (f.consumption || 0), 0) / fillUpsWithConsumption.length
      : 0;

    const sortedByOdometer = [...fillUps].sort((a, b) => a.odometer - b.odometer);
    const totalDistance = sortedByOdometer.length > 1
      ? sortedByOdometer[sortedByOdometer.length - 1].odometer - sortedByOdometer[0].odometer
      : 0;

    const averageCostPerUnit = totalDistance > 0 ? totalSpent / totalDistance : 0;

    return {
      averageConsumption,
      totalSpent,
      totalDistance,
      totalFuel,
      averageCostPerUnit,
    };
  };

  const stats = calculateStats();
  const recentFillUps = [...fillUps]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const toggleUnitSystem = () => {
    const newUnit = unitSystem === 'Metric' ? 'Imperial' : 'Metric';
    saveData(fillUps, newUnit);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderChart = () => {
    const chartData = recentFillUps.filter(f => f.consumption && f.consumption > 0).reverse();

    if (chartData.length === 0) {
      return <Text style={styles.emptyChart}>Add more fill-ups to see consumption chart</Text>;
    }

    const maxConsumption = Math.max(...chartData.map(f => f.consumption || 0));
    const chartHeight = 120;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Consumption Trend (Last 10 Fill-ups)</Text>
        <View style={styles.chart}>
          {chartData.map((fillUp, index) => {
            const height = ((fillUp.consumption || 0) / maxConsumption) * chartHeight;
            return (
              <View key={fillUp.id} style={styles.barContainer}>
                <View style={[styles.bar, { height }]}>
                  <Text style={styles.barValue}>
                    {fillUp.consumption?.toFixed(1)}
                  </Text>
                </View>
                <Text style={styles.barLabel}>{index + 1}</Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.chartUnit}>
          {unitSystem === 'Metric' ? 'L/100km' : 'MPG'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.title}>Fuel Tracker</Text>
        <TouchableOpacity style={styles.unitToggle} onPress={toggleUnitSystem}>
          <Text style={styles.unitText}>{unitSystem}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Avg Consumption</Text>
              <Text style={styles.statValue}>
                {stats.averageConsumption.toFixed(1)}
              </Text>
              <Text style={styles.statUnit}>
                {unitSystem === 'Metric' ? 'L/100km' : 'MPG'}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Spent</Text>
              <Text style={styles.statValue}>
                ${stats.totalSpent.toFixed(0)}
              </Text>
              <Text style={styles.statUnit}>Total</Text>
            </View>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Distance</Text>
              <Text style={styles.statValue}>
                {stats.totalDistance.toFixed(0)}
              </Text>
              <Text style={styles.statUnit}>
                {unitSystem === 'Metric' ? 'km' : 'mi'}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Cost per {unitSystem === 'Metric' ? 'km' : 'mi'}</Text>
              <Text style={styles.statValue}>
                ${stats.averageCostPerUnit.toFixed(3)}
              </Text>
              <Text style={styles.statUnit}>Average</Text>
            </View>
          </View>

          <View style={styles.statCardFull}>
            <Text style={styles.statLabel}>Total Fuel</Text>
            <Text style={styles.statValue}>
              {stats.totalFuel.toFixed(1)} {unitSystem === 'Metric' ? 'L' : 'gal'}
            </Text>
          </View>
        </View>

        {/* Chart */}
        {renderChart()}

        {/* Fill-ups List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Fill-ups</Text>
          {fillUps.length === 0 ? (
            <Text style={styles.emptyText}>No fill-ups recorded yet</Text>
          ) : (
            <FlatList
              data={fillUps.sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
              )}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.fillUpCard}
                  onLongPress={() => deleteFillUp(item.id)}
                >
                  <View style={styles.fillUpHeader}>
                    <Text style={styles.fillUpDate}>{formatDate(item.date)}</Text>
                    <View style={[styles.fuelTypeBadge, { backgroundColor: getFuelColor(item.fuelType) }]}>
                      <Text style={styles.fuelTypeText}>{item.fuelType}</Text>
                    </View>
                  </View>

                  <View style={styles.fillUpDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Volume:</Text>
                      <Text style={styles.detailValue}>
                        {item.liters.toFixed(2)} {unitSystem === 'Metric' ? 'L' : 'gal'}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Cost:</Text>
                      <Text style={styles.detailValue}>${item.cost.toFixed(2)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Odometer:</Text>
                      <Text style={styles.detailValue}>
                        {item.odometer.toFixed(0)} {unitSystem === 'Metric' ? 'km' : 'mi'}
                      </Text>
                    </View>
                  </View>

                  {item.tripDistance && item.tripDistance > 0 && (
                    <View style={styles.tripInfo}>
                      <View style={styles.tripRow}>
                        <Text style={styles.tripLabel}>Trip Distance:</Text>
                        <Text style={styles.tripValue}>
                          {item.tripDistance.toFixed(1)} {unitSystem === 'Metric' ? 'km' : 'mi'}
                        </Text>
                      </View>
                      {item.consumption && item.consumption > 0 && (
                        <View style={styles.tripRow}>
                          <Text style={styles.tripLabel}>Consumption:</Text>
                          <Text style={[styles.tripValue, styles.consumptionHighlight]}>
                            {item.consumption.toFixed(2)} {unitSystem === 'Metric' ? 'L/100km' : 'MPG'}
                          </Text>
                        </View>
                      )}
                      {item.costPerUnit && item.costPerUnit > 0 && (
                        <View style={styles.tripRow}>
                          <Text style={styles.tripLabel}>Cost per {unitSystem === 'Metric' ? 'km' : 'mi'}:</Text>
                          <Text style={styles.tripValue}>
                            ${item.costPerUnit.toFixed(3)}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <AdBanner />

      {/* Add Fill-up Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Fill-up</Text>

            <ScrollView>
              <Text style={styles.inputLabel}>Date</Text>
              <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
              />

              <Text style={styles.inputLabel}>
                Volume ({unitSystem === 'Metric' ? 'Liters' : 'Gallons'})
              </Text>
              <TextInput
                style={styles.input}
                value={liters}
                onChangeText={setLiters}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />

              <Text style={styles.inputLabel}>Cost ($)</Text>
              <TextInput
                style={styles.input}
                value={cost}
                onChangeText={setCost}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />

              <Text style={styles.inputLabel}>
                Odometer ({unitSystem === 'Metric' ? 'km' : 'miles'})
              </Text>
              <TextInput
                style={styles.input}
                value={odometer}
                onChangeText={setOdometer}
                placeholder="0"
                keyboardType="decimal-pad"
              />

              <Text style={styles.inputLabel}>Fuel Type</Text>
              <View style={styles.fuelTypeSelector}>
                {(['Regular', 'Premium', 'Diesel'] as FuelType[]).map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.fuelTypeButton,
                      selectedFuelType === type && styles.fuelTypeButtonActive,
                      { backgroundColor: selectedFuelType === type ? getFuelColor(type) : colors.gray.light }
                    ]}
                    onPress={() => setSelectedFuelType(type)}
                  >
                    <Text style={[
                      styles.fuelTypeButtonText,
                      selectedFuelType === type && styles.fuelTypeButtonTextActive
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={addFillUp}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getFuelColor = (type: FuelType): string => {
  switch (type) {
    case 'Regular': return '#4CAF50';
    case 'Premium': return '#FF9800';
    case 'Diesel': return '#2196F3';
    default: return colors.gray.medium;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  unitToggle: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  unitText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    padding: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  statCardFull: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray.dark,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statUnit: {
    fontSize: 11,
    color: colors.gray.medium,
    marginTop: 2,
  },
  chartContainer: {
    backgroundColor: colors.white,
    margin: spacing.md,
    marginTop: 0,
    borderRadius: 12,
    padding: spacing.md,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 140,
    paddingBottom: 20,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    backgroundColor: colors.primary,
    width: 20,
    borderRadius: 4,
    minHeight: 20,
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  barValue: {
    fontSize: 8,
    color: colors.white,
    fontWeight: '600',
    textAlign: 'center',
  },
  barLabel: {
    fontSize: 10,
    color: colors.gray.dark,
    marginTop: 4,
  },
  chartUnit: {
    fontSize: 12,
    color: colors.gray.medium,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  emptyChart: {
    textAlign: 'center',
    color: colors.gray.medium,
    fontSize: 14,
    padding: spacing.lg,
  },
  section: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.gray.medium,
    fontSize: 16,
    marginTop: spacing.xl,
  },
  fillUpCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  fillUpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  fillUpDate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  fuelTypeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  fuelTypeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  fillUpDetails: {
    marginTop: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.gray.dark,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  tripInfo: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray.light,
  },
  tripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  tripLabel: {
    fontSize: 14,
    color: colors.gray.dark,
  },
  tripValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  consumptionHighlight: {
    color: colors.primary,
    fontSize: 15,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '300',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.gray.light,
    padding: spacing.md,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  fuelTypeSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  fuelTypeButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  fuelTypeButtonActive: {
    // Background color set dynamically
  },
  fuelTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  fuelTypeButtonTextActive: {
    color: colors.white,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalButton: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.gray.light,
  },
  addButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  addButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
