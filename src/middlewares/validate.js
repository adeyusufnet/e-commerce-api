export const validate = (schema, source = 'body') => (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
        return res.status(400).json({
            message: 'Validasi gagal',
            errors: result.error.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
            })),
        });
    }

    if (source === 'query') {
        req.validatedQuery = result.data; // req.query di Express 5 read-only
    } else {
        req.body = result.data;
    }
    next();
};