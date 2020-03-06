$(function() {
	$('[data-required], [data-pattern]').on('blur', function(e, forceValidate) {
		var elem			= $(this);
		var pattern			= elem.data('pattern') || '.{2,}';
		var required		= elem.data('required') !== undefined;
		var val				= elem.val() || '';
		var match			= new RegExp(pattern);
		var patternMatches	= match.test(val);

		var sameFields		= $('[name=' + elem.attr('name') + ']').val(val);

		// Apply the following to any field that has a pattern attached, or is required
		if ((val === '' && !forceValidate) || patternMatches) {
			// Pattern matches, or val is empty. If forcing, do not allow empty
			sameFields.removeClass('invalid');
		} else {
			if ((required || val.length) && !patternMatches) {
				// If field is required or not empty, and pattern doesn't match
				sameFields.addClass('invalid');
			}
		}
	});
});