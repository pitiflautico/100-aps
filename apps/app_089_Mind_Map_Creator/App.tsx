import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from './theme';
import { AdBanner } from './components/AdBanner';
import { initializeAds, showInterstitialAd } from './services/adsManager';

const STORAGE_KEY = '@Mind_Map_Creator_data';

interface MindMapNode {
  id: string;
  text: string;
  color: string;
  children: MindMapNode[];
  parentId: string | null;
  level: number;
}

interface MindMap {
  id: string;
  name: string;
  centralIdea: string;
  rootNode: MindMapNode;
  createdAt: string;
  updatedAt: string;
}

const NODE_COLORS = [
  '#ef4444', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
];

export default function App() {
  const [mindMaps, setMindMaps] = useState<MindMap[]>([]);
  const [currentMap, setCurrentMap] = useState<MindMap | null>(null);
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
  const [showMapsModal, setShowMapsModal] = useState(false);
  const [showNewMapModal, setShowNewMapModal] = useState(false);
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [showEditNodeModal, setShowEditNodeModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [newMapName, setNewMapName] = useState('');
  const [newCentralIdea, setNewCentralIdea] = useState('');
  const [newNodeText, setNewNodeText] = useState('');
  const [newNodeColor, setNewNodeColor] = useState(NODE_COLORS[0]);
  const [adCount, setAdCount] = useState(0);

  useEffect(() => {
    initializeAds();
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const maps = JSON.parse(saved);
        setMindMaps(maps);
        if (maps.length > 0 && !currentMap) {
          setCurrentMap(maps[0]);
        }
      }
    } catch (error) {
      console.error('Load error:', error);
    }
  };

  const saveData = async (maps: MindMap[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(maps));
      setMindMaps(maps);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const createMindMap = () => {
    if (!newMapName.trim() || !newCentralIdea.trim()) {
      Alert.alert('Error', 'Please enter map name and central idea');
      return;
    }

    const rootNode: MindMapNode = {
      id: 'root',
      text: newCentralIdea.trim(),
      color: colors.primary,
      children: [],
      parentId: null,
      level: 0,
    };

    const newMap: MindMap = {
      id: Date.now().toString(),
      name: newMapName.trim(),
      centralIdea: newCentralIdea.trim(),
      rootNode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newMaps = [newMap, ...mindMaps];
    saveData(newMaps);
    setCurrentMap(newMap);
    setNewMapName('');
    setNewCentralIdea('');
    setShowNewMapModal(false);

    const newCount = adCount + 1;
    setAdCount(newCount);
    if (newCount % 5 === 0) showInterstitialAd();
  };

  const addNode = () => {
    if (!currentMap || !selectedNode || !newNodeText.trim()) {
      Alert.alert('Error', 'Please enter node text');
      return;
    }

    const newNode: MindMapNode = {
      id: Date.now().toString(),
      text: newNodeText.trim(),
      color: newNodeColor,
      children: [],
      parentId: selectedNode.id,
      level: selectedNode.level + 1,
    };

    const updatedRoot = addNodeToTree(currentMap.rootNode, selectedNode.id, newNode);
    const updatedMap: MindMap = {
      ...currentMap,
      rootNode: updatedRoot,
      updatedAt: new Date().toISOString(),
    };

    updateCurrentMap(updatedMap);
    setNewNodeText('');
    setNewNodeColor(NODE_COLORS[0]);
    setShowAddNodeModal(false);
  };

  const addNodeToTree = (node: MindMapNode, parentId: string, newNode: MindMapNode): MindMapNode => {
    if (node.id === parentId) {
      return {
        ...node,
        children: [...node.children, newNode],
      };
    }

    return {
      ...node,
      children: node.children.map(child => addNodeToTree(child, parentId, newNode)),
    };
  };

  const editNode = () => {
    if (!currentMap || !selectedNode || !newNodeText.trim()) {
      Alert.alert('Error', 'Please enter node text');
      return;
    }

    const updatedRoot = updateNodeInTree(
      currentMap.rootNode,
      selectedNode.id,
      newNodeText.trim(),
      newNodeColor
    );

    const updatedMap: MindMap = {
      ...currentMap,
      rootNode: updatedRoot,
      updatedAt: new Date().toISOString(),
    };

    updateCurrentMap(updatedMap);
    setNewNodeText('');
    setNewNodeColor(NODE_COLORS[0]);
    setShowEditNodeModal(false);
    setSelectedNode(null);
  };

  const updateNodeInTree = (
    node: MindMapNode,
    nodeId: string,
    text: string,
    color: string
  ): MindMapNode => {
    if (node.id === nodeId) {
      return { ...node, text, color };
    }

    return {
      ...node,
      children: node.children.map(child => updateNodeInTree(child, nodeId, text, color)),
    };
  };

  const deleteNode = (node: MindMapNode) => {
    if (!currentMap || node.id === 'root') {
      Alert.alert('Error', 'Cannot delete central idea');
      return;
    }

    Alert.alert('Delete Node', 'This will delete the node and all its children. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updatedRoot = deleteNodeFromTree(currentMap.rootNode, node.id);
          const updatedMap: MindMap = {
            ...currentMap,
            rootNode: updatedRoot,
            updatedAt: new Date().toISOString(),
          };
          updateCurrentMap(updatedMap);
          setSelectedNode(null);
        },
      },
    ]);
  };

  const deleteNodeFromTree = (node: MindMapNode, nodeId: string): MindMapNode => {
    return {
      ...node,
      children: node.children
        .filter(child => child.id !== nodeId)
        .map(child => deleteNodeFromTree(child, nodeId)),
    };
  };

  const updateCurrentMap = (updatedMap: MindMap) => {
    const updatedMaps = mindMaps.map(m => (m.id === updatedMap.id ? updatedMap : m));
    saveData(updatedMaps);
    setCurrentMap(updatedMap);
  };

  const deleteMindMap = (mapId: string) => {
    Alert.alert('Delete Mind Map', 'Are you sure you want to delete this mind map?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updated = mindMaps.filter(m => m.id !== mapId);
          saveData(updated);
          if (currentMap?.id === mapId) {
            setCurrentMap(updated.length > 0 ? updated[0] : null);
          }
        },
      },
    ]);
  };

  const exportAsText = () => {
    if (!currentMap) return;

    const outline = generateTextOutline(currentMap.rootNode, 0);
    const text = `${currentMap.name}\n\n${outline}`;

    Share.share({
      message: text,
      title: currentMap.name,
    });

    setShowExportModal(false);
  };

  const generateTextOutline = (node: MindMapNode, level: number): string => {
    const indent = '  '.repeat(level);
    const prefix = level === 0 ? '• ' : '- ';
    let result = `${indent}${prefix}${node.text}\n`;

    node.children.forEach(child => {
      result += generateTextOutline(child, level + 1);
    });

    return result;
  };

  const countNodes = (node: MindMapNode): number => {
    return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
  };

  const openAddNodeModal = (node: MindMapNode) => {
    setSelectedNode(node);
    setNewNodeColor(NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)]);
    setShowAddNodeModal(true);
  };

  const openEditNodeModal = (node: MindMapNode) => {
    setSelectedNode(node);
    setNewNodeText(node.text);
    setNewNodeColor(node.color);
    setShowEditNodeModal(true);
  };

  const renderNode = (node: MindMapNode, isRoot: boolean = false) => {
    const nodeStyle = isRoot ? styles.centralNode : styles.branchNode;
    const textStyle = isRoot ? styles.centralNodeText : styles.branchNodeText;

    return (
      <View key={node.id} style={styles.nodeContainer}>
        <View style={styles.nodeRow}>
          {!isRoot && <View style={[styles.connector, { backgroundColor: node.color + '40' }]} />}

          <TouchableOpacity
            style={[nodeStyle, { backgroundColor: node.color }]}
            onLongPress={() => openEditNodeModal(node)}
          >
            <Text style={textStyle}>{node.text}</Text>

            <View style={styles.nodeActions}>
              <TouchableOpacity
                style={styles.nodeActionButton}
                onPress={() => openAddNodeModal(node)}
              >
                <Text style={styles.nodeActionText}>+</Text>
              </TouchableOpacity>
              {!isRoot && (
                <TouchableOpacity
                  style={styles.nodeActionButton}
                  onPress={() => deleteNode(node)}
                >
                  <Text style={styles.nodeActionText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {node.children.length > 0 && (
          <View style={styles.childrenContainer}>
            {node.children.map(child => renderNode(child, false))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Mind Map Creator</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={() => setShowMapsModal(true)}>
            <Text style={styles.headerButtonIcon}>📋</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={() => setShowNewMapModal(true)}>
            <Text style={styles.headerButtonIcon}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {currentMap ? (
        <>
          <View style={styles.mapInfo}>
            <View style={styles.mapInfoLeft}>
              <Text style={styles.mapName}>{currentMap.name}</Text>
              <Text style={styles.mapMeta}>
                {countNodes(currentMap.rootNode)} nodes • Updated{' '}
                {new Date(currentMap.updatedAt).toLocaleDateString()}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={() => setShowExportModal(true)}
            >
              <Text style={styles.exportButtonText}>Export</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.mapContainer} contentContainerStyle={styles.mapContent}>
            {renderNode(currentMap.rootNode, true)}
          </ScrollView>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🧠</Text>
          <Text style={styles.emptyText}>No mind maps yet</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowNewMapModal(true)}
          >
            <Text style={styles.createButtonText}>Create Your First Map</Text>
          </TouchableOpacity>
        </View>
      )}

      <AdBanner />

      {/* Maps List Modal */}
      <Modal visible={showMapsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>My Mind Maps</Text>

            <FlatList
              data={mindMaps}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.mapsList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.mapCard,
                    currentMap?.id === item.id && styles.mapCardActive,
                  ]}
                  onPress={() => {
                    setCurrentMap(item);
                    setShowMapsModal(false);
                  }}
                >
                  <View style={styles.mapCardContent}>
                    <Text style={styles.mapCardName}>{item.name}</Text>
                    <Text style={styles.mapCardIdea}>{item.centralIdea}</Text>
                    <Text style={styles.mapCardMeta}>
                      {countNodes(item.rootNode)} nodes •{' '}
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => deleteMindMap(item.id)}>
                    <Text style={styles.mapCardDelete}>🗑️</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyMaps}>
                  <Text style={styles.emptyEmoji}>🧠</Text>
                  <Text style={styles.emptyText}>No mind maps yet</Text>
                </View>
              }
            />

            <TouchableOpacity
              style={[styles.modalButton, styles.closeButton]}
              onPress={() => setShowMapsModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* New Map Modal */}
      <Modal visible={showNewMapModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Mind Map</Text>

            <Text style={styles.label}>Map Name</Text>
            <TextInput
              style={styles.input}
              value={newMapName}
              onChangeText={setNewMapName}
              placeholder="Enter map name..."
              autoFocus
            />

            <Text style={styles.label}>Central Idea</Text>
            <TextInput
              style={styles.input}
              value={newCentralIdea}
              onChangeText={setNewCentralIdea}
              placeholder="Main topic or idea..."
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowNewMapModal(false);
                  setNewMapName('');
                  setNewCentralIdea('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={createMindMap}
              >
                <Text style={styles.saveButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Node Modal */}
      <Modal visible={showAddNodeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Branch</Text>

            <Text style={styles.label}>Branch Text</Text>
            <TextInput
              style={styles.input}
              value={newNodeText}
              onChangeText={setNewNodeText}
              placeholder="Enter idea or topic..."
              autoFocus
            />

            <Text style={styles.label}>Color</Text>
            <View style={styles.colorGrid}>
              {NODE_COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorButton,
                    { backgroundColor: color },
                    newNodeColor === color && styles.colorButtonActive,
                  ]}
                  onPress={() => setNewNodeColor(color)}
                />
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddNodeModal(false);
                  setNewNodeText('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={addNode}
              >
                <Text style={styles.saveButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Node Modal */}
      <Modal visible={showEditNodeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Node</Text>

            <Text style={styles.label}>Node Text</Text>
            <TextInput
              style={styles.input}
              value={newNodeText}
              onChangeText={setNewNodeText}
              placeholder="Enter text..."
              autoFocus
            />

            <Text style={styles.label}>Color</Text>
            <View style={styles.colorGrid}>
              {NODE_COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorButton,
                    { backgroundColor: color },
                    newNodeColor === color && styles.colorButtonActive,
                  ]}
                  onPress={() => setNewNodeColor(color)}
                />
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowEditNodeModal(false);
                  setNewNodeText('');
                  setSelectedNode(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={editNode}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Export Modal */}
      <Modal visible={showExportModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Export Mind Map</Text>

            {currentMap && (
              <>
                <Text style={styles.exportPreviewLabel}>Preview:</Text>
                <ScrollView style={styles.exportPreview}>
                  <Text style={styles.exportPreviewText}>
                    {generateTextOutline(currentMap.rootNode, 0)}
                  </Text>
                </ScrollView>

                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={exportAsText}
                >
                  <Text style={styles.saveButtonText}>Share as Text</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowExportModal(false)}
            >
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerButtonIcon: {
    fontSize: 20,
  },
  mapInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  mapInfoLeft: {
    flex: 1,
  },
  mapName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  mapMeta: {
    fontSize: 12,
    color: colors.gray.dark,
  },
  exportButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  mapContainer: {
    flex: 1,
  },
  mapContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  nodeContainer: {
    marginBottom: spacing.md,
  },
  nodeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  connector: {
    width: 2,
    height: '100%',
    marginRight: spacing.sm,
    marginTop: spacing.lg,
  },
  centralNode: {
    padding: spacing.lg,
    borderRadius: 20,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: spacing.md,
  },
  centralNodeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  branchNode: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  branchNodeText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
    marginBottom: spacing.sm,
  },
  nodeActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  nodeActionButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeActionText: {
    fontSize: 18,
    color: colors.white,
    fontWeight: 'bold',
  },
  childrenContainer: {
    marginLeft: spacing.xl,
    marginTop: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray.dark,
    marginBottom: spacing.xl,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: 12,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
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
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.gray.light,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  colorButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorButtonActive: {
    borderColor: colors.text,
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
  saveButton: {
    backgroundColor: colors.primary,
  },
  closeButton: {
    backgroundColor: colors.gray.light,
    marginTop: spacing.lg,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  mapsList: {
    paddingBottom: spacing.lg,
  },
  mapCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.gray.light,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  mapCardActive: {
    backgroundColor: colors.primary + '15',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  mapCardContent: {
    flex: 1,
  },
  mapCardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  mapCardIdea: {
    fontSize: 14,
    color: colors.gray.dark,
    marginBottom: spacing.xs,
  },
  mapCardMeta: {
    fontSize: 12,
    color: colors.gray.medium,
  },
  mapCardDelete: {
    fontSize: 20,
    padding: spacing.sm,
  },
  emptyMaps: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  exportPreviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray.dark,
    marginBottom: spacing.sm,
  },
  exportPreview: {
    backgroundColor: colors.gray.light,
    borderRadius: 12,
    padding: spacing.md,
    maxHeight: 300,
    marginBottom: spacing.lg,
  },
  exportPreviewText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    fontFamily: 'monospace',
  },
});
