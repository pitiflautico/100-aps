import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@simple_calendar_events';

interface Event {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  time?: string;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [actionCount, setActionCount] = useState(0);

  useEffect(() => {
    initializeAds();
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setEvents(JSON.parse(saved));
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const saveEvents = async (newEvents: Event[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newEvents));
      setEvents(newEvents);
    } catch (error) {
      console.error('Error saving events:', error);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);

    const days = [];
    const today = new Date();
    const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(year, month, day);
      const dayEvents = events.filter(e => e.date === dateStr);
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === selectedDate;

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            isToday && styles.dayCellToday,
            isSelected && styles.dayCellSelected,
          ]}
          onPress={() => setSelectedDate(dateStr)}
        >
          <Text style={[
            styles.dayNumber,
            isToday && styles.dayNumberToday,
            isSelected && styles.dayNumberSelected,
          ]}>
            {day}
          </Text>
          {dayEvents.length > 0 && (
            <View style={styles.eventDot} />
          )}
        </TouchableOpacity>
      );
    }

    return days;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(formatDate(today.getFullYear(), today.getMonth(), today.getDate()));
  };

  const addEvent = () => {
    if (!newEventTitle.trim() || !selectedDate) return;

    const newEvent: Event = {
      id: Date.now().toString(),
      date: selectedDate,
      title: newEventTitle,
      time: newEventTime.trim() || undefined,
    };

    const updated = [...events, newEvent].sort((a, b) => a.date.localeCompare(b.date));
    saveEvents(updated);
    setNewEventTitle('');
    setNewEventTime('');
    setShowAddModal(false);

    const newCount = actionCount + 1;
    setActionCount(newCount);
    if (newCount % 5 === 0) showInterstitialAd();
  };

  const deleteEvent = (id: string) => {
    saveEvents(events.filter(e => e.id !== id));
  };

  const selectedDateEvents = selectedDate ? events.filter(e => e.date === selectedDate) : [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
        <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={previousMonth} style={styles.navButton}>
          <Text style={styles.navButtonText}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
          <Text style={styles.navButtonText}>▶</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.daysOfWeekContainer}>
        {DAYS_OF_WEEK.map(day => (
          <View key={day} style={styles.dayOfWeekCell}>
            <Text style={styles.dayOfWeekText}>{day}</Text>
          </View>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {renderCalendarDays()}
      </View>

      {selectedDate && (
        <View style={styles.eventsSection}>
          <View style={styles.eventsSectionHeader}>
            <Text style={styles.eventsSectionTitle}>
              Events on {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.addEventButton}>
              <Text style={styles.addEventButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.eventsList} contentContainerStyle={styles.eventsListContent}>
            {selectedDateEvents.length === 0 ? (
              <Text style={styles.noEventsText}>No events</Text>
            ) : (
              selectedDateEvents.map(event => (
                <View key={event.id} style={styles.eventCard}>
                  <View style={styles.eventCardContent}>
                    {event.time && <Text style={styles.eventTime}>{event.time}</Text>}
                    <Text style={styles.eventTitle}>{event.title}</Text>
                  </View>
                  <TouchableOpacity onPress={() => deleteEvent(event.id)} style={styles.deleteButton}>
                    <Text style={styles.deleteButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}

      <AdBanner />

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Event</Text>
            <Text style={styles.modalSubtitle}>
              {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              })}
            </Text>

            <Text style={styles.label}>Event Title</Text>
            <TextInput
              style={styles.input}
              value={newEventTitle}
              onChangeText={setNewEventTitle}
              placeholder="What's happening?"
              autoFocus
            />

            <Text style={styles.label}>Time (optional)</Text>
            <TextInput
              style={styles.input}
              value={newEventTime}
              onChangeText={setNewEventTime}
              placeholder="e.g., 2:00 PM"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowAddModal(false);
                  setNewEventTitle('');
                  setNewEventTime('');
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonAdd]}
                onPress={addEvent}
              >
                <Text style={styles.modalButtonText}>Add Event</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  todayButton: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 8 },
  todayButtonText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  navButton: { padding: spacing.sm },
  navButtonText: { fontSize: 24, color: colors.primary },
  monthTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  daysOfWeekContainer: { flexDirection: 'row', paddingHorizontal: spacing.lg },
  dayOfWeekCell: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm },
  dayOfWeekText: { fontSize: 12, fontWeight: '600', color: colors.gray.dark },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg },
  dayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  dayCellToday: { backgroundColor: colors.accent, borderRadius: 8 },
  dayCellSelected: { backgroundColor: colors.primary, borderRadius: 8 },
  dayNumber: { fontSize: 16, color: colors.text },
  dayNumberToday: { color: colors.white, fontWeight: 'bold' },
  dayNumberSelected: { color: colors.white, fontWeight: 'bold' },
  eventDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.secondary, position: 'absolute', bottom: 4 },
  eventsSection: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  eventsSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  eventsSectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  addEventButton: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 8 },
  addEventButtonText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  eventsList: { flex: 1 },
  eventsListContent: { paddingBottom: spacing.md },
  noEventsText: { textAlign: 'center', color: colors.gray.medium, fontSize: 14, marginTop: spacing.lg },
  eventCard: { backgroundColor: colors.white, borderRadius: 12, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  eventCardContent: { flex: 1 },
  eventTime: { fontSize: 12, color: colors.primary, fontWeight: '600', marginBottom: 2 },
  eventTitle: { fontSize: 16, color: colors.text },
  deleteButton: { padding: spacing.xs },
  deleteButtonText: { fontSize: 28, color: colors.status.error, fontWeight: '300' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.xs },
  modalSubtitle: { fontSize: 14, color: colors.gray.dark, marginBottom: spacing.lg },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  input: { backgroundColor: colors.gray.light, padding: spacing.md, borderRadius: 12, fontSize: 16, marginBottom: spacing.md },
  modalButtons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  modalButton: { flex: 1, padding: spacing.lg, borderRadius: 12, alignItems: 'center' },
  modalButtonCancel: { backgroundColor: colors.gray.light },
  modalButtonAdd: { backgroundColor: colors.primary },
  modalButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  modalButtonTextCancel: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
