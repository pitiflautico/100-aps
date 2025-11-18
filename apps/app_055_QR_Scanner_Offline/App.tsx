import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Modal,
  FlatList,
  Share,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QRCode from 'react-native-qrcode-svg';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@QR_Library_data';

interface SavedQR {
  id: string;
  label: string;
  type: 'text' | 'url' | 'contact' | 'wifi';
  content: string;
  createdAt: string;
}

interface ContactData {
  name: string;
  phone: string;
  email: string;
  organization: string;
}

interface WiFiData {
  ssid: string;
  password: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'text' | 'url' | 'contact' | 'wifi'>('text');
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [contactData, setContactData] = useState<ContactData>({
    name: '',
    phone: '',
    email: '',
    organization: '',
  });
  const [wifiData, setWiFiData] = useState<WiFiData>({
    ssid: '',
    password: '',
    encryption: 'WPA',
  });
  const [savedQRs, setSavedQRs] = useState<SavedQR[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveLabel, setSaveLabel] = useState('');
  const [currentQRContent, setCurrentQRContent] = useState('');
  const [count, setCount] = useState(0);
  const qrRef = useRef<any>(null);

  useEffect(() => {
    initializeAds();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setSavedQRs(JSON.parse(saved));
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveQR = async () => {
    if (!saveLabel.trim() || !currentQRContent) return;

    const newQR: SavedQR = {
      id: Date.now().toString(),
      label: saveLabel,
      type: activeTab,
      content: currentQRContent,
      createdAt: new Date().toISOString(),
    };

    const updated = [newQR, ...savedQRs];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSavedQRs(updated);
    setShowSaveModal(false);
    setSaveLabel('');

    const newCount = count + 1;
    setCount(newCount);
    if (newCount % 5 === 0) showInterstitialAd();
  };

  const deleteQR = async (id: string) => {
    const updated = savedQRs.filter(qr => qr.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSavedQRs(updated);
  };

  const getQRContent = (): string => {
    switch (activeTab) {
      case 'text':
        return textInput;
      case 'url':
        return urlInput;
      case 'contact':
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${contactData.name}\nTEL:${contactData.phone}\nEMAIL:${contactData.email}\nORG:${contactData.organization}\nEND:VCARD`;
      case 'wifi':
        return `WIFI:T:${wifiData.encryption};S:${wifiData.ssid};P:${wifiData.password};;`;
      default:
        return '';
    }
  };

  const qrContent = getQRContent();

  const handleShare = async () => {
    try {
      await Share.share({
        message: qrContent,
        title: 'QR Code Content',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const loadSavedQR = (qr: SavedQR) => {
    setActiveTab(qr.type);
    
    switch (qr.type) {
      case 'text':
        setTextInput(qr.content);
        break;
      case 'url':
        setUrlInput(qr.content);
        break;
      case 'contact':
        // Parse vCard
        const nameMatch = qr.content.match(/FN:(.+)/);
        const phoneMatch = qr.content.match(/TEL:(.+)/);
        const emailMatch = qr.content.match(/EMAIL:(.+)/);
        const orgMatch = qr.content.match(/ORG:(.+)/);
        setContactData({
          name: nameMatch ? nameMatch[1] : '',
          phone: phoneMatch ? phoneMatch[1] : '',
          email: emailMatch ? emailMatch[1] : '',
          organization: orgMatch ? orgMatch[1] : '',
        });
        break;
      case 'wifi':
        const ssidMatch = qr.content.match(/S:([^;]+)/);
        const passMatch = qr.content.match(/P:([^;]+)/);
        const encMatch = qr.content.match(/T:([^;]+)/);
        setWiFiData({
          ssid: ssidMatch ? ssidMatch[1] : '',
          password: passMatch ? passMatch[1] : '',
          encryption: (encMatch ? encMatch[1] : 'WPA') as any,
        });
        break;
    }
    
    setShowLibrary(false);
  };

  const SavedQRCard = ({ item }: { item: SavedQR }) => (
    <View style={styles.qrCard}>
      <View style={styles.qrCardHeader}>
        <View>
          <Text style={styles.qrLabel}>{item.label}</Text>
          <Text style={styles.qrDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.qrCardButtons}>
          <TouchableOpacity
            style={styles.loadBtn}
            onPress={() => loadSavedQR(item)}
          >
            <Text style={styles.loadBtnText}>Load</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => deleteQR(item.id)}
          >
            <Text style={styles.deleteBtnText}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.qrPreview}>
        <QRCode value={item.content} size={80} />
      </View>
      <Text style={styles.qrType}>{item.type.toUpperCase()}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>QR Generator</Text>
        <TouchableOpacity
          style={styles.libraryBtn}
          onPress={() => setShowLibrary(true)}
        >
          <Text style={styles.libraryBtnText}>Library ({savedQRs.length})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Type Tabs */}
        <View style={styles.tabs}>
          {(['text', 'url', 'contact', 'wifi'] as const).map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.tab, activeTab === type && styles.tabActive]}
              onPress={() => setActiveTab(type)}
            >
              <Text style={[styles.tabText, activeTab === type && styles.tabTextActive]}>
                {type.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Text Input */}
        {activeTab === 'text' && (
          <View style={styles.section}>
            <Text style={styles.label}>Enter Text</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={textInput}
              onChangeText={setTextInput}
              placeholder="Type your text here..."
              multiline
              numberOfLines={4}
              placeholderTextColor={colors.gray.medium}
            />
          </View>
        )}

        {/* URL Input */}
        {activeTab === 'url' && (
          <View style={styles.section}>
            <Text style={styles.label}>Enter URL</Text>
            <TextInput
              style={styles.input}
              value={urlInput}
              onChangeText={setUrlInput}
              placeholder="https://example.com"
              keyboardType="url"
              autoCapitalize="none"
              placeholderTextColor={colors.gray.medium}
            />
          </View>
        )}

        {/* Contact Input */}
        {activeTab === 'contact' && (
          <View style={styles.section}>
            <Text style={styles.label}>Contact Information</Text>
            <TextInput
              style={styles.input}
              value={contactData.name}
              onChangeText={name => setContactData({...contactData, name})}
              placeholder="Full Name"
              placeholderTextColor={colors.gray.medium}
            />
            <TextInput
              style={styles.input}
              value={contactData.phone}
              onChangeText={phone => setContactData({...contactData, phone})}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              placeholderTextColor={colors.gray.medium}
            />
            <TextInput
              style={styles.input}
              value={contactData.email}
              onChangeText={email => setContactData({...contactData, email})}
              placeholder="Email Address"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={colors.gray.medium}
            />
            <TextInput
              style={styles.input}
              value={contactData.organization}
              onChangeText={organization => setContactData({...contactData, organization})}
              placeholder="Organization (optional)"
              placeholderTextColor={colors.gray.medium}
            />
          </View>
        )}

        {/* WiFi Input */}
        {activeTab === 'wifi' && (
          <View style={styles.section}>
            <Text style={styles.label}>WiFi Network</Text>
            <TextInput
              style={styles.input}
              value={wifiData.ssid}
              onChangeText={ssid => setWiFiData({...wifiData, ssid})}
              placeholder="Network Name (SSID)"
              placeholderTextColor={colors.gray.medium}
            />
            <TextInput
              style={styles.input}
              value={wifiData.password}
              onChangeText={password => setWiFiData({...wifiData, password})}
              placeholder="Password"
              secureTextEntry
              placeholderTextColor={colors.gray.medium}
            />
            <Text style={styles.sublabel}>Encryption Type</Text>
            <View style={styles.encryptionRow}>
              {(['WPA', 'WEP', 'nopass'] as const).map(enc => (
                <TouchableOpacity
                  key={enc}
                  style={[
                    styles.encryptionBtn,
                    wifiData.encryption === enc && styles.encryptionBtnActive,
                  ]}
                  onPress={() => setWiFiData({...wifiData, encryption: enc})}
                >
                  <Text style={[
                    styles.encryptionText,
                    wifiData.encryption === enc && styles.encryptionTextActive,
                  ]}>
                    {enc === 'nopass' ? 'None' : enc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* QR Code Display */}
        {qrContent && (
          <View style={styles.qrDisplay}>
            <Text style={styles.qrDisplayTitle}>Generated QR Code</Text>
            <View style={styles.qrBox}>
              <QRCode
                value={qrContent}
                size={250}
                backgroundColor={colors.white}
                color={colors.black}
                getRef={qrRef}
              />
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  setCurrentQRContent(qrContent);
                  setShowSaveModal(true);
                }}
              >
                <Text style={styles.actionBtnText}>Save to Library</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnSecondary]}
                onPress={handleShare}
              >
                <Text style={styles.actionBtnTextSecondary}>Share Content</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <AdBanner />

      {/* Save Modal */}
      <Modal visible={showSaveModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.saveModal}>
            <Text style={styles.saveModalTitle}>Save QR Code</Text>
            <TextInput
              style={styles.saveInput}
              value={saveLabel}
              onChangeText={setSaveLabel}
              placeholder="Enter a label..."
              placeholderTextColor={colors.gray.medium}
            />
            <View style={styles.saveButtons}>
              <TouchableOpacity
                style={[styles.saveBtn, styles.saveBtnCancel]}
                onPress={() => {
                  setShowSaveModal(false);
                  setSaveLabel('');
                }}
              >
                <Text style={styles.saveBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, styles.saveBtnSave]}
                onPress={saveQR}
              >
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Library Modal */}
      <Modal visible={showLibrary} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>QR Library</Text>
            <TouchableOpacity onPress={() => setShowLibrary(false)}>
              <Text style={styles.closeBtn}>Close</Text>
            </TouchableOpacity>
          </View>

          {savedQRs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No saved QR codes</Text>
              <Text style={styles.emptySubtext}>
                Generate and save QR codes for quick access
              </Text>
            </View>
          ) : (
            <FlatList
              data={savedQRs}
              keyExtractor={item => item.id}
              numColumns={2}
              renderItem={({ item }) => <SavedQRCard item={item} />}
              contentContainerStyle={styles.libraryGrid}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
  libraryBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  libraryBtnText: { fontSize: 14, color: colors.white, fontWeight: '600' },
  tabs: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.white,
  },
  tab: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.gray.light,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: colors.text },
  tabTextActive: { color: colors.white },
  section: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    marginTop: spacing.sm,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  sublabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.gray.light,
    padding: spacing.md,
    borderRadius: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  encryptionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  encryptionBtn: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.gray.light,
    borderRadius: 8,
    alignItems: 'center',
  },
  encryptionBtnActive: { backgroundColor: colors.primary },
  encryptionText: { fontSize: 14, fontWeight: '600', color: colors.text },
  encryptionTextActive: { color: colors.white },
  qrDisplay: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  qrDisplayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  qrBox: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  actionButtons: {
    width: '100%',
    gap: spacing.md,
  },
  actionBtn: {
    padding: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnSecondary: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  actionBtnTextSecondary: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveModal: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.xl,
    width: '85%',
  },
  saveModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  saveInput: {
    backgroundColor: colors.gray.light,
    padding: spacing.md,
    borderRadius: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  saveButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  saveBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnCancel: { backgroundColor: colors.gray.light },
  saveBtnSave: { backgroundColor: colors.primary },
  saveBtnText: { fontSize: 16, fontWeight: 'bold', color: colors.white },
  saveBtnTextCancel: { fontSize: 16, fontWeight: '600', color: colors.text },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray.light,
  },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  closeBtn: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    color: colors.gray.dark,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray.medium,
    textAlign: 'center',
  },
  libraryGrid: {
    padding: spacing.md,
  },
  qrCard: {
    flex: 1,
    margin: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  qrCardHeader: {
    marginBottom: spacing.md,
  },
  qrLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  qrDate: {
    fontSize: 11,
    color: colors.gray.dark,
  },
  qrCardButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  loadBtn: {
    flex: 1,
    padding: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: 6,
    alignItems: 'center',
  },
  loadBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    backgroundColor: colors.status.error,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  qrPreview: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  qrType: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gray.dark,
    textAlign: 'center',
  },
});
