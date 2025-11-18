import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Clipboard,
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
  Snackbar,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';

// TypeScript Interfaces
interface PasswordEntry {
  id: string;
  site: string;
  username: string;
  password: string;
  notes: string;
  category: Category;
  createdAt: number;
  lastModified: number;
}

type Category = 'social' | 'banking' | 'email' | 'shopping' | 'work' | 'other';

// AdMob Configuration
const bannerId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyy';

const STORAGE_KEY = '@password_manager_data';
const MASTER_PASSWORD_KEY = '@password_manager_master';

const CATEGORIES: { label: string; value: Category; icon: string; color: string }[] = [
  { label: 'Social', value: 'social', icon: 'account-group', color: '#2196F3' },
  { label: 'Banking', value: 'banking', icon: 'bank', color: '#4CAF50' },
  { label: 'Email', value: 'email', icon: 'email', color: '#FF9800' },
  { label: 'Shopping', value: 'shopping', icon: 'cart', color: '#E91E63' },
  { label: 'Work', value: 'work', icon: 'briefcase', color: '#9C27B0' },
  { label: 'Other', value: 'other', icon: 'dots-horizontal', color: '#607D8B' },
];

// Simple encryption/decryption using base64
const encrypt = (text: string): string => {
  return Buffer.from(text, 'utf-8').toString('base64');
};

const decrypt = (encoded: string): string => {
  try {
    return Buffer.from(encoded, 'base64').toString('utf-8');
  } catch {
    return '';
  }
};

export default function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [hasMasterPassword, setHasMasterPassword] = useState(false);
  const [masterPasswordInput, setMasterPasswordInput] = useState('');
  const [newMasterPassword, setNewMasterPassword] = useState('');
  const [confirmMasterPassword, setConfirmMasterPassword] = useState('');

  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [filteredPasswords, setFilteredPasswords] = useState<PasswordEntry[]>([]);
  const [selectedPassword, setSelectedPassword] = useState<PasswordEntry | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [generatorModalVisible, setGeneratorModalVisible] = useState(false);
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [menuVisible, setMenuVisible] = useState(false);

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    site: '',
    username: '',
    password: '',
    notes: '',
    category: 'other' as Category,
  });

  // Password generator state
  const [generatorLength, setGeneratorLength] = useState('16');
  const [generatorUppercase, setGeneratorUppercase] = useState(true);
  const [generatorNumbers, setGeneratorNumbers] = useState(true);
  const [generatorSymbols, setGeneratorSymbols] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState('');

  // Check for master password on mount
  useEffect(() => {
    checkMasterPassword();
  }, []);

  // Filter passwords
  useEffect(() => {
    let filtered = [...passwords];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.site.toLowerCase().includes(query) ||
          p.username.toLowerCase().includes(query) ||
          p.notes.toLowerCase().includes(query)
      );
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(p => p.category === filterCategory);
    }

    setFilteredPasswords(filtered);
  }, [passwords, searchQuery, filterCategory]);

  const checkMasterPassword = async () => {
    try {
      const stored = await AsyncStorage.getItem(MASTER_PASSWORD_KEY);
      setHasMasterPassword(!!stored);
      setIsLocked(!!stored);
    } catch (error) {
      console.error('Error checking master password:', error);
    }
  };

  const setupMasterPassword = async () => {
    if (!newMasterPassword.trim()) {
      Alert.alert('Error', 'Please enter a master password');
      return;
    }

    if (newMasterPassword !== confirmMasterPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (newMasterPassword.length < 6) {
      Alert.alert('Error', 'Master password must be at least 6 characters');
      return;
    }

    try {
      const encrypted = encrypt(newMasterPassword);
      await AsyncStorage.setItem(MASTER_PASSWORD_KEY, encrypted);
      setHasMasterPassword(true);
      setIsLocked(false);
      setNewMasterPassword('');
      setConfirmMasterPassword('');
      loadPasswords();
    } catch (error) {
      Alert.alert('Error', 'Failed to setup master password');
    }
  };

  const unlockApp = async () => {
    try {
      const stored = await AsyncStorage.getItem(MASTER_PASSWORD_KEY);
      if (!stored) {
        Alert.alert('Error', 'Master password not found');
        return;
      }

      const decrypted = decrypt(stored);
      if (masterPasswordInput === decrypted) {
        setIsLocked(false);
        setMasterPasswordInput('');
        loadPasswords();
      } else {
        Alert.alert('Error', 'Incorrect master password');
        setMasterPasswordInput('');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to unlock app');
    }
  };

  const lockApp = () => {
    setIsLocked(true);
    setPasswords([]);
    setMasterPasswordInput('');
  };

  const loadPasswords = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const encrypted = JSON.parse(stored);
        const decrypted = encrypted.map((p: any) => ({
          ...p,
          password: decrypt(p.password),
        }));
        setPasswords(decrypted);
      }
    } catch (error) {
      console.error('Error loading passwords:', error);
    }
  };

  const savePasswords = async (newPasswords: PasswordEntry[]) => {
    try {
      const encrypted = newPasswords.map(p => ({
        ...p,
        password: encrypt(p.password),
      }));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(encrypted));
      setPasswords(newPasswords);
    } catch (error) {
      console.error('Error saving passwords:', error);
    }
  };

  const openModal = (password?: PasswordEntry) => {
    if (password) {
      setEditingPassword(password);
      setFormData({
        site: password.site,
        username: password.username,
        password: password.password,
        notes: password.notes,
        category: password.category,
      });
    } else {
      setEditingPassword(null);
      setFormData({
        site: '',
        username: '',
        password: '',
        notes: '',
        category: 'other',
      });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingPassword(null);
  };

  const savePassword = async () => {
    if (!formData.site.trim()) {
      Alert.alert('Error', 'Please enter site name');
      return;
    }

    if (!formData.password.trim()) {
      Alert.alert('Error', 'Please enter password');
      return;
    }

    const entry: PasswordEntry = {
      id: editingPassword?.id || Date.now().toString(),
      site: formData.site.trim(),
      username: formData.username.trim(),
      password: formData.password,
      notes: formData.notes.trim(),
      category: formData.category,
      createdAt: editingPassword?.createdAt || Date.now(),
      lastModified: Date.now(),
    };

    let newPasswords: PasswordEntry[];
    if (editingPassword) {
      newPasswords = passwords.map(p => (p.id === editingPassword.id ? entry : p));
    } else {
      newPasswords = [...passwords, entry];
    }

    await savePasswords(newPasswords);
    closeModal();
  };

  const deletePassword = (id: string) => {
    Alert.alert('Delete Password', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const newPasswords = passwords.filter(p => p.id !== id);
          await savePasswords(newPasswords);
          if (selectedPassword?.id === id) {
            setViewModalVisible(false);
          }
        },
      },
    ]);
  };

  const viewPassword = (password: PasswordEntry) => {
    setSelectedPassword(password);
    setViewModalVisible(true);
  };

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    setSnackbarMessage(`${label} copied to clipboard`);
    setSnackbarVisible(true);
  };

  const generatePassword = () => {
    const length = parseInt(generatorLength) || 16;
    let charset = 'abcdefghijklmnopqrstuvwxyz';

    if (generatorUppercase) {
      charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    }
    if (generatorNumbers) {
      charset += '0123456789';
    }
    if (generatorSymbols) {
      charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    }

    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    setGeneratedPassword(password);
  };

  const useGeneratedPassword = () => {
    setFormData({ ...formData, password: generatedPassword });
    setGeneratorModalVisible(false);
    setGeneratedPassword('');
  };

  const getCategoryInfo = (category: Category) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[CATEGORIES.length - 1];
  };

  // Master password setup screen
  if (!hasMasterPassword) {
    return (
      <PaperProvider>
        <View style={styles.container}>
          <Appbar.Header>
            <Appbar.Content title="Password Manager" />
          </Appbar.Header>

          <View style={styles.setupContainer}>
            <IconButton icon="lock-outline" size={80} iconColor="#6200ee" />
            <Text variant="headlineMedium" style={styles.setupTitle}>
              Setup Master Password
            </Text>
            <Text variant="bodyLarge" style={styles.setupSubtitle}>
              Create a master password to secure your passwords
            </Text>

            <TextInput
              label="Master Password"
              value={newMasterPassword}
              onChangeText={setNewMasterPassword}
              secureTextEntry
              style={styles.setupInput}
              mode="outlined"
            />

            <TextInput
              label="Confirm Master Password"
              value={confirmMasterPassword}
              onChangeText={setConfirmMasterPassword}
              secureTextEntry
              style={styles.setupInput}
              mode="outlined"
            />

            <Button mode="contained" onPress={setupMasterPassword} style={styles.setupButton}>
              Create Master Password
            </Button>
          </View>
        </View>
      </PaperProvider>
    );
  }

  // Lock screen
  if (isLocked) {
    return (
      <PaperProvider>
        <View style={styles.container}>
          <Appbar.Header>
            <Appbar.Content title="Password Manager" />
          </Appbar.Header>

          <View style={styles.lockContainer}>
            <IconButton icon="lock" size={80} iconColor="#6200ee" />
            <Text variant="headlineMedium" style={styles.lockTitle}>
              Enter Master Password
            </Text>

            <TextInput
              label="Master Password"
              value={masterPasswordInput}
              onChangeText={setMasterPasswordInput}
              secureTextEntry
              style={styles.lockInput}
              mode="outlined"
              autoFocus
            />

            <Button mode="contained" onPress={unlockApp} style={styles.unlockButton}>
              Unlock
            </Button>
          </View>
        </View>
      </PaperProvider>
    );
  }

  // Main app screen
  const renderPasswordCard = (password: PasswordEntry) => {
    const categoryInfo = getCategoryInfo(password.category);

    return (
      <Card key={password.id} style={styles.passwordCard} onPress={() => viewPassword(password)}>
        <Card.Content>
          <View style={styles.passwordHeader}>
            <View style={styles.passwordHeaderLeft}>
              <IconButton icon={categoryInfo.icon} size={28} iconColor={categoryInfo.color} />
              <View style={styles.passwordHeaderText}>
                <Text variant="titleMedium" style={styles.passwordSite}>
                  {password.site}
                </Text>
                {password.username && (
                  <Text variant="bodySmall" style={styles.passwordUsername}>
                    {password.username}
                  </Text>
                )}
              </View>
            </View>
            <IconButton
              icon="content-copy"
              size={20}
              onPress={() => copyToClipboard(password.password, 'Password')}
            />
          </View>

          <View style={styles.passwordDetails}>
            <Chip
              style={[styles.categoryChip, { backgroundColor: categoryInfo.color + '20' }]}
              textStyle={[styles.chipText, { color: categoryInfo.color }]}
            >
              {categoryInfo.label}
            </Chip>
            <Chip icon="lock" style={styles.detailChip} textStyle={styles.chipText}>
              {password.password.length} chars
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
          <Appbar.Content title="Password Manager" />
          <Appbar.Action icon="lock" onPress={lockApp} />
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={<Appbar.Action icon="dots-vertical" onPress={() => setMenuVisible(true)} />}
          >
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                setFilterCategory('all');
                setSearchQuery('');
              }}
              title="Clear Filters"
              leadingIcon="filter-off"
            />
          </Menu>
        </Appbar.Header>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <TextInput
            placeholder="Search passwords..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            mode="outlined"
            left={<TextInput.Icon icon="magnify" />}
            dense
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
            <Chip
              selected={filterCategory === 'all'}
              onPress={() => setFilterCategory('all')}
              style={styles.filterChip}
            >
              All
            </Chip>
            {CATEGORIES.map(cat => (
              <Chip
                key={cat.value}
                selected={filterCategory === cat.value}
                onPress={() => setFilterCategory(cat.value)}
                icon={cat.icon}
                style={styles.filterChip}
              >
                {cat.label}
              </Chip>
            ))}
          </ScrollView>
        </View>

        {/* Passwords List */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {filteredPasswords.length === 0 ? (
            <View style={styles.emptyState}>
              <IconButton icon="lock-open-outline" size={64} iconColor="#ccc" />
              <Text variant="titleMedium" style={styles.emptyText}>
                {passwords.length === 0 ? 'No passwords yet' : 'No passwords found'}
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>
                {searchQuery || filterCategory !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add your first password to get started'}
              </Text>
            </View>
          ) : (
            <>
              <Text variant="labelLarge" style={styles.countLabel}>
                {filteredPasswords.length} password{filteredPasswords.length !== 1 ? 's' : ''}
              </Text>
              {filteredPasswords.map(renderPasswordCard)}
            </>
          )}

          <View style={styles.adContainer}>
            <BannerAd unitId={bannerId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
          </View>
        </ScrollView>

        {/* Add/Edit Password Modal */}
        <Portal>
          <Modal
            visible={modalVisible}
            onDismiss={closeModal}
            contentContainerStyle={styles.modal}
          >
            <ScrollView>
              <Text variant="titleLarge" style={styles.modalTitle}>
                {editingPassword ? 'Edit Password' : 'Add Password'}
              </Text>

              <TextInput
                label="Site/Service Name *"
                value={formData.site}
                onChangeText={text => setFormData({ ...formData, site: text })}
                style={styles.input}
                mode="outlined"
              />

              <TextInput
                label="Username/Email"
                value={formData.username}
                onChangeText={text => setFormData({ ...formData, username: text })}
                style={styles.input}
                mode="outlined"
              />

              <View style={styles.passwordInputRow}>
                <TextInput
                  label="Password *"
                  value={formData.password}
                  onChangeText={text => setFormData({ ...formData, password: text })}
                  style={[styles.input, styles.passwordInput]}
                  mode="outlined"
                  secureTextEntry
                />
                <Button
                  mode="outlined"
                  onPress={() => setGeneratorModalVisible(true)}
                  icon="refresh"
                  style={styles.generateButton}
                >
                  Generate
                </Button>
              </View>

              <Text variant="labelMedium" style={styles.label}>
                Category
              </Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map(cat => (
                  <Chip
                    key={cat.value}
                    selected={formData.category === cat.value}
                    onPress={() => setFormData({ ...formData, category: cat.value })}
                    icon={cat.icon}
                    style={styles.categoryChipSelect}
                  >
                    {cat.label}
                  </Chip>
                ))}
              </View>

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
                <Button mode="contained" onPress={savePassword} style={styles.modalButton}>
                  {editingPassword ? 'Update' : 'Add'}
                </Button>
              </View>
            </ScrollView>
          </Modal>

          {/* View Password Modal */}
          <Modal
            visible={viewModalVisible}
            onDismiss={() => setViewModalVisible(false)}
            contentContainerStyle={styles.modal}
          >
            {selectedPassword && (
              <ScrollView>
                <View style={styles.viewHeader}>
                  <View style={styles.viewHeaderLeft}>
                    <IconButton
                      icon={getCategoryInfo(selectedPassword.category).icon}
                      size={36}
                      iconColor={getCategoryInfo(selectedPassword.category).color}
                    />
                    <Text variant="headlineSmall" style={styles.viewTitle}>
                      {selectedPassword.site}
                    </Text>
                  </View>
                  <View style={styles.viewActions}>
                    <IconButton
                      icon="pencil"
                      size={24}
                      onPress={() => {
                        setViewModalVisible(false);
                        openModal(selectedPassword);
                      }}
                    />
                    <IconButton
                      icon="delete"
                      size={24}
                      iconColor="#d32f2f"
                      onPress={() => deletePassword(selectedPassword.id)}
                    />
                  </View>
                </View>

                <Chip
                  style={[
                    styles.viewCategoryChip,
                    {
                      backgroundColor:
                        getCategoryInfo(selectedPassword.category).color + '20',
                    },
                  ]}
                  textStyle={{
                    color: getCategoryInfo(selectedPassword.category).color,
                  }}
                >
                  {getCategoryInfo(selectedPassword.category).label}
                </Chip>

                <Divider style={styles.divider} />

                {selectedPassword.username && (
                  <>
                    <View style={styles.fieldRow}>
                      <View style={styles.fieldContent}>
                        <Text variant="labelMedium" style={styles.fieldLabel}>
                          Username
                        </Text>
                        <Text variant="bodyLarge">{selectedPassword.username}</Text>
                      </View>
                      <IconButton
                        icon="content-copy"
                        size={20}
                        onPress={() =>
                          copyToClipboard(selectedPassword.username, 'Username')
                        }
                      />
                    </View>
                    <Divider style={styles.divider} />
                  </>
                )}

                <View style={styles.fieldRow}>
                  <View style={styles.fieldContent}>
                    <Text variant="labelMedium" style={styles.fieldLabel}>
                      Password
                    </Text>
                    <Text variant="bodyLarge" style={styles.passwordText}>
                      {'•'.repeat(selectedPassword.password.length)}
                    </Text>
                  </View>
                  <IconButton
                    icon="content-copy"
                    size={20}
                    onPress={() => copyToClipboard(selectedPassword.password, 'Password')}
                  />
                </View>

                {selectedPassword.notes && (
                  <>
                    <Divider style={styles.divider} />
                    <Text variant="labelMedium" style={styles.fieldLabel}>
                      Notes
                    </Text>
                    <Text variant="bodyMedium">{selectedPassword.notes}</Text>
                  </>
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

          {/* Password Generator Modal */}
          <Modal
            visible={generatorModalVisible}
            onDismiss={() => setGeneratorModalVisible(false)}
            contentContainerStyle={styles.modal}
          >
            <Text variant="titleLarge" style={styles.modalTitle}>
              Password Generator
            </Text>

            <TextInput
              label="Length"
              value={generatorLength}
              onChangeText={setGeneratorLength}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />

            <View style={styles.generatorOptions}>
              <Chip
                selected={generatorUppercase}
                onPress={() => setGeneratorUppercase(!generatorUppercase)}
                style={styles.generatorChip}
              >
                Uppercase (A-Z)
              </Chip>
              <Chip
                selected={generatorNumbers}
                onPress={() => setGeneratorNumbers(!generatorNumbers)}
                style={styles.generatorChip}
              >
                Numbers (0-9)
              </Chip>
              <Chip
                selected={generatorSymbols}
                onPress={() => setGeneratorSymbols(!generatorSymbols)}
                style={styles.generatorChip}
              >
                Symbols (!@#$)
              </Chip>
            </View>

            <Button
              mode="contained"
              onPress={generatePassword}
              icon="refresh"
              style={styles.generatePasswordButton}
            >
              Generate Password
            </Button>

            {generatedPassword && (
              <>
                <View style={styles.generatedPasswordContainer}>
                  <Text variant="bodyLarge" style={styles.generatedPassword}>
                    {generatedPassword}
                  </Text>
                  <IconButton
                    icon="content-copy"
                    size={20}
                    onPress={() => copyToClipboard(generatedPassword, 'Password')}
                  />
                </View>

                <Button
                  mode="contained"
                  onPress={useGeneratedPassword}
                  style={styles.usePasswordButton}
                >
                  Use This Password
                </Button>
              </>
            )}

            <Button
              mode="outlined"
              onPress={() => {
                setGeneratorModalVisible(false);
                setGeneratedPassword('');
              }}
              style={styles.closeButton}
            >
              Close
            </Button>
          </Modal>
        </Portal>

        <FAB icon="plus" style={styles.fab} onPress={() => openModal()} />

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={2000}
        >
          {snackbarMessage}
        </Snackbar>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  setupTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  setupSubtitle: {
    marginBottom: 32,
    textAlign: 'center',
    color: '#666',
  },
  setupInput: {
    width: '100%',
    marginBottom: 16,
  },
  setupButton: {
    width: '100%',
    marginTop: 8,
  },
  lockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  lockTitle: {
    marginTop: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  lockInput: {
    width: '100%',
    marginBottom: 16,
  },
  unlockButton: {
    width: '100%',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
  },
  searchInput: {
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  filterChips: {
    marginTop: 8,
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
  countLabel: {
    marginBottom: 12,
    color: '#666',
  },
  passwordCard: {
    marginBottom: 12,
    elevation: 2,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  passwordHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  passwordHeaderText: {
    flex: 1,
  },
  passwordSite: {
    fontWeight: 'bold',
  },
  passwordUsername: {
    color: '#666',
    marginTop: 2,
  },
  passwordDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    height: 28,
  },
  detailChip: {
    backgroundColor: '#e3f2fd',
    height: 28,
  },
  chipText: {
    fontSize: 12,
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
  passwordInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  passwordInput: {
    flex: 1,
  },
  generateButton: {
    marginTop: 4,
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
  categoryChipSelect: {
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
    marginBottom: 12,
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
  viewCategoryChip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    color: '#666',
    marginBottom: 4,
  },
  passwordText: {
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  generatorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  generatorChip: {
    marginBottom: 4,
  },
  generatePasswordButton: {
    marginBottom: 16,
  },
  generatedPasswordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  generatedPassword: {
    flex: 1,
    fontFamily: 'monospace',
  },
  usePasswordButton: {
    marginBottom: 8,
  },
  closeButton: {
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#6200ee',
  },
});
