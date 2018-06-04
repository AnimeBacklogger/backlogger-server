'use strict';

module.exports = ({head, appRender, appRootId="reactRoot" }) => `
<html>
<head>
    ${head}
</head>
<body>
    <div id="#${appRootId}">
        ${appRender}
    </div>
</body>
</html>
`;
