import React, { useState } from 'react';
// Components
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import GroupTypePicker from '@/components/onboarding/GroupTypePicker';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';

// Another map, e.g. a couple's shared one beside each person's own. Travellers can be
// added in its settings afterwards; `firstTraveller` (you) starts it off.
function NewMapForm({ firstTraveller, onCreate, onCancel }) {
  const [name, setName] = useState('');
  const [groupType, setGroupType] = useState('COUPLE');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Give the map a name.');
    setBusy(true);
    setError(null);
    try {
      await onCreate({ name: name.trim(), groupType, travellers: [{ name: firstTraveller || 'Me' }] });
    } catch (err) {
      setError(err.friendlyMessage || 'The map could not be created.');
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='grid gap-3 border-2 border-dashed border-poster-brown/60 p-3' noValidate>
      <GroupTypePicker name='new-map-group' value={groupType} onChange={setGroupType} />
      <FormField id='new-map-name' label='Map name' required>
        <TextInput value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
      </FormField>
      <InlineAlert>{error}</InlineAlert>
      <div className='grid grid-row justify-end gap-2'>
        <Button quiet onClick={onCancel}>
          Cancel
        </Button>
        <Button type='submit' busy={busy}>
          Create map
        </Button>
      </div>
    </form>
  );
}

export default NewMapForm;
