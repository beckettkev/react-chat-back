const colours = [
  '#e21400', '#91580f', '#f8a700', '#f78b00',
  '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
  '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
];

export default class Colours {
  // Gets the color of a username through our hash function
  getUsernameColour = username => {
    if (typeof username !== 'undefined') {
        // Compute hash code
        let hash = 7;

        for (let i = 0; i < username.length; i++) {
          hash = username.charCodeAt(i) + (hash << 5) - hash;
        }

        // Calculate color
        const index = Math.abs(hash % colours.length);

        return colours[index];
    }

    return '#000000';
  }

  isBrightEnough = (colour) => {
    const c = colour.substring(1);   // strip #
    const rgb = parseInt(c, 16);   // convert rrggbb to decimal
    const r = (rgb >> 16) & 0xff;  // extract red
    const g = (rgb >>  8) & 0xff;  // extract green
    const b = (rgb >>  0) & 0xff;  // extract blue
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

    return luma < 100 ? false : true;  
  }
}
