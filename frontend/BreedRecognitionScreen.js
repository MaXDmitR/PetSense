import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Button,
    Image,
    Alert,
    TouchableOpacity,
    Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = 'http://192.168.108.58:8000/upload-photo/';
{/*192.168.108.58    192.168.0.102*/}

const BreedRecognitionScreen = ({ navigation }) => {
    const [imageUri, setImageUri] = useState(null);
    const [serverResponse, setServerResponse] = useState(null);
    const [isButtonVisible, setIsButtonVisible] = useState(false);

    const progressAnim = useRef(new Animated.Value(0)).current;
    const timerRef = useRef(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const startLoadingAnimation = () => {
        progressAnim.setValue(0);
        setIsButtonVisible(false);

        Animated.timing(progressAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: false,
        }).start();

        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = setTimeout(() => {
            setIsButtonVisible(true);
        }, 3000);
    };

    const handleImageResult = (result) => {
        if (!result.canceled && result.assets?.length > 0) {
            setImageUri(result.assets[0].uri);
            setServerResponse(null);
            startLoadingAnimation();
        }
    };

    const takePhoto = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert('Дозвіл відхилено', 'Надайте доступ до камери.');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.6,
        });
        handleImageResult(result);
    };

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert('Дозвіл відхилено', 'Надайте доступ до галереї.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.6,
        });
        handleImageResult(result);
    };

    const selectImage = () => {
        Alert.alert(
            'Додати фото',
            'Оберіть джерело:',
            [
                { text: 'Камера', onPress: takePhoto },
                { text: 'Галерея', onPress: pickImage },
                { text: 'Скасувати', style: 'cancel' },
            ],
            { cancelable: true }
        );
    };

    const sendPicture = async () => {
        if (!imageUri) {
            Alert.alert('Помилка', 'Спочатку виберіть фото.');
            return;
        }

        setServerResponse('⏳ Аналізую на сервері...');

        const formData = new FormData();
        formData.append('file', {
            uri: imageUri,
            name: 'photo.jpg',
            type: 'image/jpeg',
        });

        try {
            const response = await axios.post(BACKEND_URL, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setServerResponse(
                `Результат: ${response.data.class}\nІмовірність: ${response.data.probability}%`
            );
        } catch (error) {
            console.error('Upload error:', error);
            setServerResponse('❌ Помилка під час розпізнавання');
        }
    };

    const widthInterpolated = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#61dafb" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Розпізнавання породи</Text>
            </View>

            <View style={styles.content}>
                <Button title="Додати фото" onPress={selectImage} color="#61dafb" />

                <View style={styles.imageContainer}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.image} />
                    ) : (
                        <Text style={styles.placeholderText}>Фото не вибране</Text>
                    )}
                </View>

                {/* --- НОВА ПОРАДА ПІД ФОТО --- */}
                <Text style={styles.tipText}>
                    💡 Для кращого результату використовуйте чіткі фото при гарному освітленні.
                </Text>

                <View style={styles.actionContainer}>
                    {imageUri && !isButtonVisible && (
                        <View style={styles.progressWrapper}>
                            <Text style={styles.progressText}>Обробка зображення...</Text>
                            <View style={styles.progressBarBackground}>
                                <Animated.View 
                                    style={[
                                        styles.progressBarFill, 
                                        { width: widthInterpolated }
                                    ]} 
                                />
                            </View>
                        </View>
                    )}

                    {imageUri && isButtonVisible && (
                        <Button title="Переглянути результат" onPress={sendPicture} />
                    )}
                </View>

                {serverResponse && (
                    <Text style={styles.response}>{serverResponse}</Text>
                )}

                {/* --- НОВИЙ ДИСКЛЕЙМЕР ВНИЗУ --- */}
                <Text style={styles.footerDisclaimer}>
                    PetSense AI може помилятися. Перевіряйте результат.
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#282c34' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 15,
        backgroundColor: '#3a404a',
        paddingTop: 50,
    },
    backButton: { marginRight: 10 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#61dafb' },

    content: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
    },
    imageContainer: {
        marginTop: 20,
        width: '100%',
        height: 350,
        borderRadius: 15,
        backgroundColor: '#3a404a',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#61dafb',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
        borderRadius: 15,
    },
    placeholderText: { color: '#bbb' },
    
    // Стиль для поради під фото
    tipText: {
        marginTop: 10,
        color: '#888',
        fontSize: 12,
        textAlign: 'center',
        fontStyle: 'italic',
    },

    actionContainer: {
        marginTop: 20,
        height: 60, 
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },

    progressWrapper: {
        width: '80%',
        alignItems: 'center',
    },
    progressText: {
        color: '#bbb',
        marginBottom: 5,
        fontSize: 12,
    },
    progressBarBackground: {
        width: '100%',
        height: 6,
        backgroundColor: '#3a404a',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#61dafb',
        borderRadius: 3,
    },

    response: {
        marginTop: 20,
        color: 'white',
        fontSize: 18,
        textAlign: 'center',
        fontWeight: 'bold',
    },

    // Стиль для нижнього дисклеймера
    footerDisclaimer: {
        marginTop: 'auto', // Притискає текст до самого низу
        marginBottom: 10,
        color: '#555',
        fontSize: 10,
        textAlign: 'center',
    },
});

export default BreedRecognitionScreen;