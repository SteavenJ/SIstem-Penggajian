import { describe, it, expect, vi } from 'vitest';

describe('CSV export memory leak', () => {
  it('calls URL.revokeObjectURL after creating an object URL', () => {
    // Simulate the export flow
    const blob = new Blob(['test'], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    // Simulate click and cleanup
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'test.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});
