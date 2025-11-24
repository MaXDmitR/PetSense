import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    StatusBar,
    Alert,
} from 'react-native';
// 1. Імпорти для навігації
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { Feather, MaterialIcons } from '@expo/vector-icons';

// Імпортуємо екран розпізнавання
import BreedRecognitionScreen from './BreedRecognitionScreen';

// Створюємо Стек Навігатор
const Stack = createStackNavigator();

// ГЛОБАЛЬНІ СТИЛІ
const accentColor = '#61dafb';
const darkBg = '#282c34';
const darkCard = '#3a404a';
const textColor = '#e0e0e0';

// --- КОМПОНЕНТ ГОЛОВНОГО ЕКРАНУ (Винесений окремо) ---
function HomeScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={darkBg} />
            
            <View style={styles.header}>
                <Text style={styles.logoText}>PetSense AI</Text>
                <Text style={styles.tagline}>Animal Recognition & Cat Mood Detector</Text>
            </View>

            <View style={styles.cardsContainer}>
                {/* Картка 1: Перехід через navigation.navigate */}
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('BreedRecognition')}
                    activeOpacity={0.7}
                >
                    <Feather name="camera" size={50} color={accentColor} style={styles.cardIcon} />
                    <Text style={styles.cardTitle}>Розпізнати породу тварини</Text>
                    <Text style={styles.cardDescription}>(Фото)</Text>
                </TouchableOpacity>

                {/* Картка 2 */}
                <TouchableOpacity
                    style={[styles.card, styles.disabledCard]}
                    onPress={() => Alert.alert("У розробці", "Цей модуль поки що недоступний.")}
                    activeOpacity={0.7}
                    disabled={true}
                >
                    <MaterialIcons name="mic-none" size={50} color={textColor} style={styles.cardIcon} />
                    <Text style={styles.cardTitle}>Розпізнати настрій кота</Text>
                    <Text style={styles.cardDescription}>(Аудіо)</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>© 2025 PetSense AI</Text>
            </View>
        </View>
    );
}

// --- ГОЛОВНИЙ КОМПОНЕНТ APP (Налаштування навігації) ---
export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Home"
                screenOptions={{
                    headerShown: false, // Ховаємо стандартний хедер, бо у нас є свій красивий
                    cardStyle: { backgroundColor: darkBg }, // Фон для всіх екранів
                    // Анімація слайду збоку (як в iOS/Telegram)
                    cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS, 
                }}
            >
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="BreedRecognition" component={BreedRecognitionScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

// --- Стилі (Ті самі, що й були) ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: darkBg,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingBottom: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logoText: {
        fontSize: 38,
        fontWeight: 'bold',
        color: accentColor,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    tagline: {
        fontSize: 16,
        color: textColor,
        marginTop: 5,
        fontStyle: 'italic',
    },
    cardsContainer: {
        flex: 1,
        width: '90%',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    card: {
        width: '100%',
        height: '45%',
        backgroundColor: darkCard,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 15,
    },
    disabledCard: {
        opacity: 0.6,
        backgroundColor: '#444',
    },
    cardIcon: {
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: textColor,
        textAlign: 'center',
        marginHorizontal: 10,
    },
    cardDescription: {
        fontSize: 16,
        color: '#a0a0a0',
        marginTop: 5,
    },
    footer: {
        marginTop: 30,
    },
    footerText: {
        color: '#777',
        fontSize: 12,
    },
});