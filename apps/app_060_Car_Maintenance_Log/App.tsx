import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView,
  TextInput, Modal, FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const VEHICLE_KEY = '@Car_Vehicle_data';
const RECORDS_KEY = '@Car_Records_data';

interface Vehicle {
  make: string;
  model: string;
  year: string;
  license: string;
  currentMileage: number;
}

interface MaintenanceRecord {
  id: string;
  type: string;
  date: string;
  mileage: number;
  cost: number;
  notes: string;
  createdAt: string;
}

const MAINTENANCE_TYPES = [
  'Oil Change', 'Tire Rotation', 'Brake Service', 'Air Filter', 'Battery',
  'Transmission', 'Coolant Flush', 'Spark Plugs', 'Alignment', 'Inspection', 'Other',
];

export default function App() {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [showRecords, setShowRecords] = useState(false);
  const [count, setCount] = useState(0);

  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [license, setLicense] = useState('');
  const [currentMileage, setCurrentMileage] = useState('');

  const [type, setType] = useState('Oil Change');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mileage, setMileage] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    initializeAds();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [savedVehicle, savedRecords] = await Promise.all([
        AsyncStorage.getItem(VEHICLE_KEY),
        AsyncStorage.getItem(RECORDS_KEY),
      ]);

      if (savedVehicle) setVehicle(JSON.parse(savedVehicle));
      if (savedRecords) setRecords(JSON.parse(savedRecords));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveVehicle = async () => {
    if (!make || !model || !year) return;

    const newVehicle: Vehicle = {
      make, model, year, license,
      currentMileage: parseFloat(currentMileage) || 0,
    };

    await AsyncStorage.setItem(VEHICLE_KEY, JSON.stringify(newVehicle));
    setVehicle(newVehicle);
    setShowVehicleForm(false);
  };

  const addRecord = async () => {
    if (!type || !date || !mileage) return;

    const newRecord: MaintenanceRecord = {
      id: Date.now().toString(),
      type, date,
      mileage: parseFloat(mileage),
      cost: parseFloat(cost) || 0,
      notes,
      createdAt: new Date().toISOString(),
    };

    const updated = [newRecord, ...records];
    await AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(updated));
    setRecords(updated);
    setShowRecordForm(false);
    resetRecordForm();

    if (vehicle && parseFloat(mileage) > vehicle.currentMileage) {
      const updatedVehicle = { ...vehicle, currentMileage: parseFloat(mileage) };
      await AsyncStorage.setItem(VEHICLE_KEY, JSON.stringify(updatedVehicle));
      setVehicle(updatedVehicle);
    }

    const newCount = count + 1;
    setCount(newCount);
    if (newCount % 5 === 0) showInterstitialAd();
  };

  const deleteRecord = async (id: string) => {
    const updated = records.filter(r => r.id !== id);
    await AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(updated));
    setRecords(updated);
  };

  const resetRecordForm = () => {
    setType('Oil Change');
    setDate(new Date().toISOString().split('T')[0]);
    setMileage('');
    setCost('');
    setNotes('');
  };

  const getTotalCost = (): number => {
    return records.reduce((sum, r) => sum + r.cost, 0);
  };

  const getCostByType = () => {
    const costsByType: { [key: string]: number } = {};
    records.forEach(record => {
      if (!costsByType[record.type]) costsByType[record.type] = 0;
      costsByType[record.type] += record.cost;
    });
    return costsByType;
  };

  const getNextService = () => {
    const oilChanges = records.filter(r => r.type === 'Oil Change');
    if (oilChanges.length === 0) return null;

    const lastOilChange = oilChanges[0];
    const nextMileage = lastOilChange.mileage + 5000;

    return {
      type: 'Oil Change',
      mileage: nextMileage,
      remaining: vehicle ? nextMileage - vehicle.currentMileage : 0,
    };
  };

  const costsByType = getCostByType();
  const totalCost = getTotalCost();
  const nextService = getNextService();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Car Maintenance</Text>
        {vehicle && (
          <TouchableOpacity
            style={styles.vehicleBtn}
            onPress={() => {
              setMake(vehicle.make);
              setModel(vehicle.model);
              setYear(vehicle.year);
              setLicense(vehicle.license);
              setCurrentMileage(String(vehicle.currentMileage));
              setShowVehicleForm(true);
            }}
          >
            <Text style={styles.vehicleBtnText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView>
        {!vehicle ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No vehicle added</Text>
            <TouchableOpacity style={styles.addVehicleBtn} onPress={() => setShowVehicleForm(true)}>
              <Text style={styles.addVehicleBtnText}>Add Vehicle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.vehicleCard}>
              <Text style={styles.vehicleName}>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </Text>
              {vehicle.license && <Text style={styles.vehicleLicense}>License: {vehicle.license}</Text>}
              <Text style={styles.vehicleMileage}>Mileage: {vehicle.currentMileage.toLocaleString()} km</Text>
            </View>

            {nextService && (
              <View style={styles.reminderCard}>
                <Text style={styles.reminderTitle}>Next Service Due</Text>
                <Text style={styles.reminderType}>{nextService.type}</Text>
                <Text style={styles.reminderMileage}>At {nextService.mileage.toLocaleString()} km</Text>
                {nextService.remaining > 0 && (
                  <Text style={styles.reminderRemaining}>({nextService.remaining.toLocaleString()} km remaining)</Text>
                )}
              </View>
            )}

            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Cost Summary</Text>
              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Total Spent</Text>
                <Text style={styles.totalAmount}>${totalCost.toFixed(2)}</Text>
              </View>
              <View style={styles.typesCostList}>
                {Object.entries(costsByType).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([type, cost]) => (
                  <View key={type} style={styles.typeCostCard}>
                    <Text style={styles.typeCostType}>{type}</Text>
                    <Text style={styles.typeCostAmount}>${cost.toFixed(2)}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.recordsSection}>
              <View style={styles.recordsHeader}>
                <Text style={styles.sectionTitle}>Maintenance Records ({records.length})</Text>
                <TouchableOpacity style={styles.viewAllBtn} onPress={() => setShowRecords(true)}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>

              {records.slice(0, 3).map(record => (
                <View key={record.id} style={styles.recordCard}>
                  <View style={styles.recordHeader}>
                    <Text style={styles.recordType}>{record.type}</Text>
                    <Text style={styles.recordCost}>${record.cost.toFixed(2)}</Text>
                  </View>
                  <Text style={styles.recordDate}>{record.date}</Text>
                  <Text style={styles.recordMileage}>{record.mileage.toLocaleString()} km</Text>
                  {record.notes && <Text style={styles.recordNotes}>{record.notes}</Text>}
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {vehicle && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowRecordForm(true)}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      <AdBanner />

      <Modal visible={showVehicleForm} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Vehicle Information</Text>
            <TouchableOpacity onPress={() => setShowVehicleForm(false)}>
              <Text style={styles.closeBtn}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContent}>
            <Text style={styles.label}>Make</Text>
            <TextInput style={styles.input} value={make} onChangeText={setMake} placeholder="Toyota, Ford..." />
            <Text style={styles.label}>Model</Text>
            <TextInput style={styles.input} value={model} onChangeText={setModel} placeholder="Camry, F-150..." />
            <Text style={styles.label}>Year</Text>
            <TextInput style={styles.input} value={year} onChangeText={setYear} placeholder="2020" keyboardType="number-pad" />
            <Text style={styles.label}>License</Text>
            <TextInput style={styles.input} value={license} onChangeText={setLicense} placeholder="ABC-1234" autoCapitalize="characters" />
            <Text style={styles.label}>Mileage</Text>
            <TextInput style={styles.input} value={currentMileage} onChangeText={setCurrentMileage} placeholder="0" keyboardType="number-pad" />
            <TouchableOpacity style={styles.saveBtn} onPress={saveVehicle}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={showRecordForm} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Maintenance</Text>
            <TouchableOpacity onPress={() => { setShowRecordForm(false); resetRecordForm(); }}>
              <Text style={styles.closeBtn}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContent}>
            <Text style={styles.label}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
              {MAINTENANCE_TYPES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, type === t && styles.typeChipActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Date</Text>
            <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
            <Text style={styles.label}>Mileage</Text>
            <TextInput style={styles.input} value={mileage} onChangeText={setMileage} placeholder="Current mileage" keyboardType="number-pad" />
            <Text style={styles.label}>Cost</Text>
            <TextInput style={styles.input} value={cost} onChangeText={setCost} placeholder="0.00" keyboardType="decimal-pad" />
            <Text style={styles.label}>Notes</Text>
            <TextInput style={[styles.input, styles.textArea]} value={notes} onChangeText={setNotes} placeholder="Additional notes..." multiline numberOfLines={3} />

            <TouchableOpacity style={styles.saveBtn} onPress={addRecord}>
              <Text style={styles.saveBtnText}>Add Record</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={showRecords} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>All Records</Text>
            <TouchableOpacity onPress={() => setShowRecords(false)}>
              <Text style={styles.closeBtn}>Close</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={records}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.fullRecordCard}>
                <View style={styles.recordHeader}>
                  <Text style={styles.recordType}>{item.type}</Text>
                  <TouchableOpacity onPress={() => deleteRecord(item.id)}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.recordDetails}>
                  <Text style={styles.recordDate}>{item.date}</Text>
                  <Text style={styles.recordMileage}>{item.mileage.toLocaleString()} km</Text>
                  <Text style={styles.recordCost}>${item.cost.toFixed(2)}</Text>
                </View>
                {item.notes && <Text style={styles.recordNotes}>{item.notes}</Text>}
              </View>
            )}
            contentContainerStyle={styles.recordsList}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray.light },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  vehicleBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.gray.light, borderRadius: 8 },
  vehicleBtnText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, marginTop: 100 },
  emptyText: { fontSize: 18, color: colors.gray.dark, marginBottom: spacing.lg },
  addVehicleBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, backgroundColor: colors.primary, borderRadius: 12 },
  addVehicleBtnText: { fontSize: 16, fontWeight: 'bold', color: colors.white },
  vehicleCard: { margin: spacing.lg, padding: spacing.lg, backgroundColor: colors.primary, borderRadius: 16, elevation: 4 },
  vehicleName: { fontSize: 20, fontWeight: 'bold', color: colors.white, marginBottom: spacing.sm },
  vehicleLicense: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: spacing.xs },
  vehicleMileage: { fontSize: 16, color: colors.secondary, fontWeight: '600' },
  reminderCard: { margin: spacing.lg, marginTop: 0, padding: spacing.lg, backgroundColor: colors.secondary, borderRadius: 12 },
  reminderTitle: { fontSize: 14, color: colors.white, marginBottom: spacing.sm },
  reminderType: { fontSize: 18, fontWeight: 'bold', color: colors.white },
  reminderMileage: { fontSize: 16, color: colors.white, marginTop: spacing.xs },
  reminderRemaining: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: spacing.xs },
  statsSection: { padding: spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: spacing.md },
  totalCard: { backgroundColor: colors.white, padding: spacing.lg, borderRadius: 12, alignItems: 'center', marginBottom: spacing.md, elevation: 2 },
  totalLabel: { fontSize: 14, color: colors.gray.dark, marginBottom: spacing.xs },
  totalAmount: { fontSize: 32, fontWeight: 'bold', color: colors.primary },
  typesCostList: { gap: spacing.sm },
  typeCostCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.white, padding: spacing.md, borderRadius: 8, elevation: 1 },
  typeCostType: { fontSize: 14, color: colors.text },
  typeCostAmount: { fontSize: 14, fontWeight: '600', color: colors.primary },
  recordsSection: { padding: spacing.lg },
  recordsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  viewAllBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.primary, borderRadius: 6 },
  viewAllText: { fontSize: 12, color: colors.white, fontWeight: '600' },
  recordCard: { backgroundColor: colors.white, padding: spacing.md, borderRadius: 12, marginBottom: spacing.sm, elevation: 1 },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  recordType: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  recordCost: { fontSize: 16, fontWeight: '600', color: colors.primary },
  recordDate: { fontSize: 12, color: colors.gray.dark },
  recordMileage: { fontSize: 12, color: colors.gray.dark, marginTop: spacing.xs },
  recordNotes: { fontSize: 12, color: colors.text, marginTop: spacing.sm, fontStyle: 'italic' },
  fab: { position: 'absolute', right: spacing.lg, bottom: 80, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  fabText: { fontSize: 32, fontWeight: '300', color: colors.white },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray.light },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  closeBtn: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  formContent: { padding: spacing.lg },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm },
  input: { backgroundColor: colors.gray.light, padding: spacing.md, borderRadius: 12, fontSize: 16, color: colors.text },
  textArea: { height: 80, textAlignVertical: 'top' },
  typeScroll: { marginBottom: spacing.md },
  typeChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.gray.light, borderRadius: 20, marginRight: spacing.sm },
  typeChipActive: { backgroundColor: colors.primary },
  typeChipText: { fontSize: 12, color: colors.text, fontWeight: '600' },
  typeChipTextActive: { color: colors.white },
  saveBtn: { marginTop: spacing.xl, padding: spacing.lg, backgroundColor: colors.primary, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { fontSize: 16, fontWeight: 'bold', color: colors.white },
  recordsList: { padding: spacing.lg },
  fullRecordCard: { backgroundColor: colors.white, padding: spacing.lg, borderRadius: 12, marginBottom: spacing.md, elevation: 2 },
  recordDetails: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  deleteText: { fontSize: 14, color: colors.status.error, fontWeight: '600' },
});
