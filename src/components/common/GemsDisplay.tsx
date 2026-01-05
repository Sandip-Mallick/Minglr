import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import { useGemsStore } from '../../store';
import { GemIcon, BoosterIcon } from '../Icons';

interface GemsDisplayProps {
    onPress?: () => void;
    showBoosters?: boolean;
    size?: 'small' | 'medium' | 'large';
    animated?: boolean;
}

export const GemsDisplay: React.FC<GemsDisplayProps> = ({
    onPress,
    showBoosters = false,
    size = 'medium',
    animated = false,
}) => {
    const { colors, primaryColor } = useTheme();
    const { gemsBalance, boostersOwned } = useGemsStore();

    const getFontSize = () => {
        switch (size) {
            case 'small': return 12;
            case 'large': return 18;
            default: return 14;
        }
    };

    const getIconSize = () => {
        switch (size) {
            case 'small': return 14;
            case 'large': return 22;
            default: return 18;
        }
    };

    const getPadding = () => {
        switch (size) {
            case 'small': return { px: 8, py: 4 };
            case 'large': return { px: 16, py: 10 };
            default: return { px: 12, py: 6 };
        }
    };

    const padding = getPadding();
    const iconSize = getIconSize();

    const containerStyle = [
        styles.container,
        {
            backgroundColor: colors.surface,
            borderColor: primaryColor,
            paddingHorizontal: padding.px,
            paddingVertical: padding.py,
        },
    ];

    const content = (
        <>
            <View style={styles.item}>
                <View style={styles.iconContainer}>
                    <GemIcon size={iconSize} animated={animated} />
                </View>
                <Text style={[styles.value, { color: colors.text, fontSize: getFontSize() }]}>
                    {gemsBalance.toLocaleString()}
                </Text>
            </View>

            {showBoosters && (
                <View style={[styles.item, styles.boosterItem]}>
                    <View style={styles.iconContainer}>
                        <BoosterIcon size={iconSize} animated={animated} />
                    </View>
                    <Text style={[styles.value, { color: colors.text, fontSize: getFontSize() }]}>
                        {boostersOwned}
                    </Text>
                </View>
            )}
        </>
    );

    if (onPress) {
        return (
            <TouchableOpacity style={containerStyle} onPress={onPress}>
                {content}
            </TouchableOpacity>
        );
    }

    return <View style={containerStyle}>{content}</View>;
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        borderWidth: 1,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    boosterItem: {
        marginLeft: 12,
        paddingLeft: 12,
        borderLeftWidth: 1,
        borderLeftColor: 'rgba(0,0,0,0.1)',
    },
    iconContainer: {
        marginRight: 4,
    },
    value: {
        fontWeight: '600',
    },
});

export default GemsDisplay;
