import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, FlatList, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from './theme';

export default function App() {
  const [notes, setNotes] = useState([{id:'1',title:'First note',content:'Sample content'}]);
  const [editing, setEditing] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const save = () => {
    if(title.trim()){
      setNotes([...notes,{id:Date.now().toString(),title,content}]);
      setTitle('');setContent('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Notes</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Title"/>
      <TextInput style={[styles.input,styles.contentInput]} value={content} onChangeText={setContent} placeholder="Content" multiline/>
      <TouchableOpacity style={styles.btn} onPress={save}>
        <Text style={styles.btnText}>Save Note</Text>
      </TouchableOpacity>
      <FlatList data={notes} keyExtractor={i=>i.id} renderItem={({item})=>(
        <View style={styles.note}>
          <Text style={styles.noteTitle}>{item.title}</Text>
          <Text style={styles.noteContent}>{item.content}</Text>
        </View>
      )}/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginBottom: spacing.lg },
  input: { backgroundColor: colors.white, padding: spacing.md, borderRadius: 8, marginBottom: spacing.sm },
  contentInput: { height: 100 },
  btn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: 12, alignItems: 'center', marginBottom: spacing.lg },
  btnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  note: { backgroundColor: colors.white, padding: spacing.lg, borderRadius: 12, marginBottom: spacing.sm },
  noteTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: spacing.xs },
  noteContent: { fontSize: 14, color: colors.gray.dark },
});
