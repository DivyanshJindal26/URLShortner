import React from 'react';
import {
  FlexWidget,
  TextWidget,
  ImageWidget,
} from 'react-native-android-widget';

export function ShortenerWidget({ width, height }) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 12,
        gap: 8,
      }}
      clickAction="OPEN_APP"
      clickActionData={{ screen: '/' }}
    >
      <TextWidget
        text="softkernel.in"
        style={{ color: '#6366f1', fontSize: 12, fontWeight: '700' }}
      />
      <FlexWidget
        style={{ flexDirection: 'row', gap: 8, width: 'match_parent' }}
      >
        {/* Shorten button */}
        <FlexWidget
          style={{
            flex: 1,
            backgroundColor: '#6366f1',
            borderRadius: 8,
            padding: 10,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          clickAction="OPEN_APP"
          clickActionData={{ screen: '/(tabs)/', params: { action: 'shorten' } }}
        >
          <TextWidget
            text="🔗 Shorten"
            style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}
          />
        </FlexWidget>

        {/* Upload button */}
        <FlexWidget
          style={{
            flex: 1,
            backgroundColor: '#2a2a2a',
            borderRadius: 8,
            padding: 10,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          clickAction="OPEN_APP"
          clickActionData={{ screen: '/(tabs)/upload' }}
        >
          <TextWidget
            text="📷 Upload"
            style={{ color: '#e5e5e5', fontSize: 12, fontWeight: '600' }}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}

// Widget task handler — called by the native bridge when widget is tapped
export async function widgetTaskHandler(props) {
  const { widgetAction, widgetInfo, clickActionData } = props;

  if (widgetAction === 'WIDGET_ADDED' || widgetAction === 'WIDGET_UPDATE') {
    props.renderWidget(<ShortenerWidget width={widgetInfo.width} height={widgetInfo.height} />);
  }
}
