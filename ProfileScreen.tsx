import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setUser } from './store';
import { authService } from './auth';

interface ProfileScreenProps {
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onLogout }) => {
  const { user, discoveredPokemon, encounters } = useSelector((state: RootState) => state.app);
  const dispatch = useDispatch();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await authService.signOut();
              dispatch(setUser(null));
              onLogout();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const getCompletionPercentage = () => {
    const totalPokemon = 150; // First generation
    return Math.round((discoveredPokemon.length / totalPokemon) * 100);
  };

  const getBadges = () => {
    const badges = [];
    
    if (discoveredPokemon.length >= 1) badges.push('First Catch');
    if (discoveredPokemon.length >= 10) badges.push('Collector');
    if (discoveredPokemon.length >= 50) badges.push('Expert Trainer');
    if (encounters.length >= 5) badges.push('Hunter');
    if (encounters.length >= 20) badges.push('Master Hunter');
    
    return badges;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.userId}>ID: {user?.id.substring(0, 8)}...</Text>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Pokemon Discovered</Text>
          <Text style={styles.statValue}>{discoveredPokemon.length}</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Pokemon Encountered</Text>
          <Text style={styles.statValue}>{encounters.length}</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Pokedex Completion</Text>
          <Text style={styles.statValue}>{getCompletionPercentage()}%</Text>
        </View>
        
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { width: `${getCompletionPercentage()}%` }
            ]}
          />
        </View>
      </View>

      <View style={styles.badgesContainer}>
        <Text style={styles.sectionTitle}>Badges</Text>
        {getBadges().length > 0 ? (
          <View style={styles.badgesList}>
            {getBadges().map((badge, index) => (
              <View key={index} style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noBadges}>No badges earned yet. Start catching Pokemon!</Text>
        )}
      </View>

      <View style={styles.recentContainer}>
        <Text style={styles.sectionTitle}>Recent Discoveries</Text>
        {discoveredPokemon.slice(-5).reverse().map((pokemon, index) => (
          <View key={index} style={styles.recentItem}>
            <Text style={styles.recentPokemon}>
              #{pokemon.id} {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
            </Text>
          </View>
        ))}
        {discoveredPokemon.length === 0 && (
          <Text style={styles.noRecent}>No Pokemon discovered yet</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c5aa0',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  userInfo: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  email: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  userId: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c5aa0',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 16,
    color: '#333',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5aa0',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2c5aa0',
    borderRadius: 4,
  },
  badgesContainer: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: '#ffd700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  noBadges: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  recentContainer: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recentItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  recentPokemon: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  noRecent: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});